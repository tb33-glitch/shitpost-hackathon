import { useState, useEffect } from 'react'

// Check if URL is a static image (not gif, video, etc.)
function isStaticImage(url) {
  if (!url) return false
  const lower = url.toLowerCase()
  // Exclude GIFs, videos, and Reddit video hosting
  if (lower.includes('.gif')) return false
  if (lower.includes('.mp4')) return false
  if (lower.includes('.webm')) return false
  if (lower.includes('.gifv')) return false
  if (lower.includes('v.redd.it')) return false
  if (lower.includes('redgifs.com')) return false
  // Must be an image URL
  return lower.includes('.jpg') ||
         lower.includes('.jpeg') ||
         lower.includes('.png') ||
         lower.includes('.webp') ||
         lower.includes('i.redd.it') ||
         lower.includes('i.imgur.com')
}

// Fallback memes in case API fails - popular meme templates
// Imgflip URLs are already optimized and fast
const FALLBACK_MEMES = [
  { id: 'drake', title: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', score: 99999 },
  { id: 'distracted', title: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', score: 98000 },
  { id: 'buttons', title: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', score: 97000 },
  { id: 'change', title: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', score: 96000 },
  { id: 'exit', title: 'Left Exit 12 Off Ramp', url: 'https://i.imgflip.com/22bdq6.jpg', score: 95000 },
  { id: 'everywhere', title: 'X, X Everywhere', url: 'https://i.imgflip.com/1ihzfe.jpg', score: 94000 },
  { id: 'gru', title: 'Gru Plan', url: 'https://i.imgflip.com/26jxvz.jpg', score: 93000 },
  { id: 'trade', title: 'Trade Offer', url: 'https://i.imgflip.com/54hjww.jpg', score: 92000 },
  { id: 'disaster', title: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg', score: 91000 },
  { id: 'bernie', title: 'Bernie Asking', url: 'https://i.imgflip.com/3oevdk.jpg', score: 90000 },
  { id: 'buff', title: 'Buff Doge vs Cheems', url: 'https://i.imgflip.com/43a45p.jpg', score: 89000 },
  { id: 'panik', title: 'Panik Kalm Panik', url: 'https://i.imgflip.com/3qqcim.jpg', score: 88000 },
  { id: 'sad', title: 'Sad Pablo Escobar', url: 'https://i.imgflip.com/4bfrxd.jpg', score: 87000 },
  { id: 'anakin', title: 'Anakin Padme 4 Panel', url: 'https://i.imgflip.com/5c7lwq.jpg', score: 86000 },
  { id: 'uno', title: 'UNO Draw 25', url: 'https://i.imgflip.com/3lmzyx.jpg', score: 85000 },
  { id: 'always', title: 'Always Has Been', url: 'https://i.imgflip.com/46e43q.jpg', score: 84000 },
  { id: 'stonks', title: 'Stonks', url: 'https://i.imgflip.com/3c7c8x.png', score: 83000 },
  { id: 'confused', title: 'Confused Math Lady', url: 'https://i.imgflip.com/1otk96.jpg', score: 82000 },
  { id: 'batman', title: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk.jpg', score: 81000 },
  { id: 'brain', title: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg', score: 80000 },
  { id: 'woman', title: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345v97.jpg', score: 79000 },
  { id: 'fine', title: 'This Is Fine', url: 'https://i.imgflip.com/1nhqil.jpg', score: 78000 },
  { id: 'spiderman', title: 'Spider-Man Pointing', url: 'https://i.imgflip.com/1tkjq9.jpg', score: 77000 },
  { id: 'success', title: 'Success Kid', url: 'https://i.imgflip.com/1bhk.jpg', score: 76000 },
  { id: 'doge', title: 'Doge', url: 'https://i.imgflip.com/4t0m5.jpg', score: 75000 },
  { id: 'roll', title: 'Roll Safe', url: 'https://i.imgflip.com/1h7in3.jpg', score: 74000 },
  { id: 'fry', title: 'Futurama Fry', url: 'https://i.imgflip.com/1bgw.jpg', score: 73000 },
  { id: 'captain', title: 'Captain Phillips', url: 'https://i.imgflip.com/3si4.jpg', score: 72000 },
  { id: 'pikachu', title: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg', score: 71000 },
  { id: 'spongebob', title: 'Mocking Spongebob', url: 'https://i.imgflip.com/1otk96.jpg', score: 70000 },
]

export default function useRedditMemes() {
  const [memes, setMemes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchMemes() {
      try {
        setIsLoading(true)
        setError(null)

        // Try meme-api.com first (more reliable for memes)
        let fetchedMemes = []

        try {
          // Fetch multiple batches for variety
          const responses = await Promise.all([
            fetch('https://meme-api.com/gimme/memes/10'),
            fetch('https://meme-api.com/gimme/dankmemes/10'),
            fetch('https://meme-api.com/gimme/MemeEconomy/10'),
          ])

          for (const response of responses) {
            if (response.ok) {
              const data = await response.json()
              if (data.memes) {
                fetchedMemes.push(...data.memes
                  .filter(m => isStaticImage(m.url))
                  .map(m => ({
                    id: m.postLink,
                    title: m.title,
                    url: m.url,
                    // Use smallest preview for fast thumbnail loading
                    thumbnail: m.preview?.[0] || m.url,
                    subreddit: m.subreddit,
                    score: m.ups || 1000,
                    author: m.author,
                  })))
              }
            }
          }
        } catch (apiError) {
          console.warn('Meme API failed, trying Reddit directly:', apiError)
        }

        // If meme-api failed, try Reddit directly
        if (fetchedMemes.length === 0) {
          try {
            const subreddits = ['memes', 'dankmemes', 'MemeEconomy']
            for (const sub of subreddits) {
              const response = await fetch(
                `https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`,
                {
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'shitpost.pro/1.0',
                  }
                }
              )

              if (response.ok) {
                const data = await response.json()
                if (data?.data?.children) {
                  const posts = data.data.children
                    .filter(post => {
                      const p = post.data
                      if (p.over_18) return false
                      if (!p.url) return false
                      return isStaticImage(p.url)
                    })
                    .map(post => ({
                      id: post.data.id,
                      title: post.data.title,
                      url: post.data.url,
                      subreddit: post.data.subreddit,
                      score: post.data.score,
                      author: post.data.author,
                    }))
                  fetchedMemes.push(...posts)
                }
              }
            }
          } catch (redditError) {
            console.warn('Reddit API failed:', redditError)
          }
        }

        // If still no memes, use fallback
        if (fetchedMemes.length === 0) {
          console.log('Using fallback memes')
          fetchedMemes = [...FALLBACK_MEMES]
        }

        // Sort by score and deduplicate
        const uniqueMemes = fetchedMemes
          .filter((meme, index, self) =>
            index === self.findIndex(m => m.url === meme.url)
          )
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 30)

        setMemes(uniqueMemes)
      } catch (err) {
        console.error('Error fetching memes:', err)
        setError(err.message)
        // Use fallback on error
        setMemes(FALLBACK_MEMES)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemes()
  }, [])

  const refetch = async () => {
    setMemes([])
    setIsLoading(true)
    setError(null)

    try {
      let fetchedMemes = []

      // Try meme-api.com first
      try {
        const responses = await Promise.all([
          fetch('https://meme-api.com/gimme/memes/10'),
          fetch('https://meme-api.com/gimme/dankmemes/10'),
          fetch('https://meme-api.com/gimme/MemeEconomy/10'),
        ])

        for (const response of responses) {
          if (response.ok) {
            const data = await response.json()
            if (data.memes) {
              fetchedMemes.push(...data.memes
                .filter(m => isStaticImage(m.url))
                .map(m => ({
                  id: m.postLink,
                  title: m.title,
                  url: m.url,
                  thumbnail: m.preview?.[0] || m.url,
                  subreddit: m.subreddit,
                  score: m.ups || 1000,
                  author: m.author,
                })))
            }
          }
        }
      } catch (apiError) {
        console.warn('Meme API failed:', apiError)
      }

      // Fallback if needed
      if (fetchedMemes.length === 0) {
        fetchedMemes = [...FALLBACK_MEMES]
      }

      const uniqueMemes = fetchedMemes
        .filter((meme, index, self) =>
          index === self.findIndex(m => m.url === meme.url)
        )
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 30)

      setMemes(uniqueMemes)
    } catch (err) {
      setError(err.message)
      setMemes(FALLBACK_MEMES)
    } finally {
      setIsLoading(false)
    }
  }

  return { memes, isLoading, error, refetch }
}
