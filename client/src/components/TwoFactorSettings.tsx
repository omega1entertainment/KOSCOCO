import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, ShieldCheck, ShieldOff, Copy, Download, RefreshCw, Loader2 } from "lucide-react";

interface TwoFactorSettingsProps {
  userType?: 'user' | 'affiliate' | 'admin';
}

export default function TwoFactorSettings({ userType = 'user' }: TwoFactorSettingsProps) {
  const { toast } = useToast();
  
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    secret: string;
    otpauthUrl: string;
  } | null>(null);

  const BACKUP_CODES_STORAGE_KEY = '2fa_pending_backup_codes';

  useEffect(() => {
    const storedCodes = localStorage.getItem(BACKUP_CODES_STORAGE_KEY);
    if (storedCodes) {
      try {
        const parsedCodes = JSON.parse(storedCodes);
        if (Array.isArray(parsedCodes) && parsedCodes.length > 0) {
          setBackupCodes(parsedCodes);
          setShowBackupCodesDialog(true);
          setBackupCodesSaved(false);
        }
      } catch (e) {
        localStorage.removeItem(BACKUP_CODES_STORAGE_KEY);
      }
    }
  }, []);

  const persistBackupCodes = (codes: string[]) => {
    if (codes.length > 0) {
      localStorage.setItem(BACKUP_CODES_STORAGE_KEY, JSON.stringify(codes));
    }
  };

  const clearPersistedBackupCodes = () => {
    localStorage.removeItem(BACKUP_CODES_STORAGE_KEY);
  };

  const { data: twoFactorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/2fa/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/2fa/status', 'GET');
      return await response.json();
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showBackupCodesDialog && !backupCodesSaved && backupCodes.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved backup codes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showBackupCodesDialog, backupCodesSaved, backupCodes.length]);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/2fa/setup', 'POST');
      return await response.json();
    },
    onSuccess: (data) => {
      setSetupData(data);
      setShowSetupDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/2fa/enable', 'POST', {
        code: verificationCode,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      persistBackupCodes(data.backupCodes);
      setBackupCodesSaved(false);
      setShowSetupDialog(false);
      setShowBackupCodesDialog(true);
      setVerificationCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/2fa/disable', 'POST', {
        password,
        code: verificationCode,
      });
      return await response.json();
    },
    onSuccess: () => {
      setShowDisableDialog(false);
      setPassword("");
      setVerificationCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Disable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/2fa/backup/regenerate', 'POST', {
        password,
        code: verificationCode,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      persistBackupCodes(data.backupCodes);
      setBackupCodesSaved(false);
      setShowRegenerateDialog(false);
      setShowBackupCodesDialog(true);
      setPassword("");
      setVerificationCode("");
      toast({
        title: "Backup Codes Regenerated",
        description: "Your new backup codes are ready. Make sure to save them.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Regeneration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'koscoco-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isEnabled = twoFactorStatus?.enabled;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your {userType} account
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? (
                <>
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Enabled
                </>
              ) : (
                <>
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when logging in.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowRegenerateDialog(true)}
                  data-testid="button-regenerate-backup"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                  data-testid="button-disable-2fa"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                When enabled, you'll be required to enter a 6-digit code from your authenticator app 
                (like Google Authenticator or Authy) in addition to your password when logging in.
              </p>
              
              <Button 
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                data-testid="button-enable-2fa"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
            </DialogDescription>
          </DialogHeader>
          
          {setupData && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <img 
                  src={setupData.qrCodeDataUrl} 
                  alt="2FA QR Code" 
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={setupData.secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  data-testid="input-setup-verify-code"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => enableMutation.mutate()}
              disabled={enableMutation.isPending || verificationCode.length !== 6}
              data-testid="button-confirm-enable-2fa"
            >
              {enableMutation.isPending ? "Verifying..." : "Enable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password and a verification code to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                data-testid="input-disable-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification Code</Label>
              <Input
                id="disable-code"
                type="text"
                placeholder="000000 or XXXX-XXXX"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center tracking-widest"
                data-testid="input-disable-code"
              />
              <p className="text-xs text-muted-foreground">
                Enter a code from your authenticator app or a backup code
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending || !password || !verificationCode}
              data-testid="button-confirm-disable-2fa"
            >
              {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              This will invalidate your existing backup codes and generate new ones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="regen-password">Password</Label>
              <Input
                id="regen-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                data-testid="input-regen-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regen-code">Verification Code</Label>
              <Input
                id="regen-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center tracking-widest"
                maxLength={6}
                data-testid="input-regen-code"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending || !password || verificationCode.length !== 6}
              data-testid="button-confirm-regenerate"
            >
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Display Dialog - Prevent closing without saving */}
      <Dialog 
        open={showBackupCodesDialog} 
        onOpenChange={(open) => {
          if (!open && !backupCodesSaved) {
            toast({
              title: "Save Your Codes First",
              description: "Please copy or download your backup codes before closing.",
              variant: "destructive",
            });
            return;
          }
          setShowBackupCodesDialog(open);
        }}
      >
        <DialogContent 
          className="sm:max-w-md" 
          onPointerDownOutside={(e) => {
            if (!backupCodesSaved) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!backupCodesSaved) {
              e.preventDefault();
              toast({
                title: "Save Your Codes First",
                description: "Please copy or download your backup codes before closing.",
                variant: "destructive",
              });
            }
          }}
          onInteractOutside={(e) => {
            if (!backupCodesSaved) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Your Backup Codes</DialogTitle>
            <DialogDescription>
              Save these backup codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                These codes will only be shown once. If you lose them and your authenticator, 
                you may lose access to your account. You must save them before continuing.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  copyToClipboard(backupCodes.join('\n'));
                  setBackupCodesSaved(true);
                  toast({
                    title: "Codes Copied",
                    description: "Backup codes copied to clipboard. Store them safely!",
                  });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  downloadBackupCodes();
                  setBackupCodesSaved(true);
                  toast({
                    title: "Codes Downloaded",
                    description: "Backup codes downloaded. Store the file safely!",
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            {backupCodesSaved && (
              <Alert>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Backup codes saved. You can now close this dialog.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                if (!backupCodesSaved) {
                  toast({
                    title: "Save Your Codes First",
                    description: "Please copy or download your backup codes before closing.",
                    variant: "destructive",
                  });
                  return;
                }
                clearPersistedBackupCodes();
                setShowBackupCodesDialog(false);
              }}
              disabled={!backupCodesSaved}
              data-testid="button-close-backup-codes"
            >
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
