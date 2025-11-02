import VideoCard from '../VideoCard'
import musicImage from '@assets/generated_images/Music_and_Dance_category_e223aa7f.png'

export default function VideoCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <VideoCard
        id="1"
        title="Amazing Dance Performance"
        thumbnail={musicImage}
        creator={{
          name: "John Doe",
          avatar: undefined
        }}
        category="Music & Dance"
        votes={1247}
        views={5832}
        onPlay={() => console.log('Play video')}
        onVote={() => console.log('Vote')}
        onShare={() => console.log('Share')}
      />
    </div>
  )
}
