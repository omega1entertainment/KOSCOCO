import StatsCard from '../StatsCard'
import { Users } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <div className="p-8 max-w-xs">
      <StatsCard
        icon={Users}
        label="Total Participants"
        value="1,247"
        trend={{ value: "12%", positive: true }}
      />
    </div>
  )
}
