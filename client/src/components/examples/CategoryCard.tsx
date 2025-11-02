import CategoryCard from '../CategoryCard'
import musicImage from '@assets/generated_images/Music_and_Dance_category_e223aa7f.png'

export default function CategoryCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <CategoryCard
        title="Music & Dance"
        image={musicImage}
        subcategories={['Singing', 'Dancing', 'Instrumentals']}
        entryCount={234}
        onClick={() => console.log('Category clicked')}
      />
    </div>
  )
}
