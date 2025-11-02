import NavigationHeader from '../NavigationHeader'

export default function NavigationHeaderExample() {
  return (
    <NavigationHeader
      onLoginClick={() => console.log('Login clicked')}
      onRegisterClick={() => console.log('Register clicked')}
    />
  )
}
