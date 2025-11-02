import Hero from '../Hero'

export default function HeroExample() {
  return (
    <Hero 
      onRegisterClick={() => console.log('Register clicked')}
      onWatchClick={() => console.log('Watch clicked')}
    />
  )
}
