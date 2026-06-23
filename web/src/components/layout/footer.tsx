import { REPO_URL } from '@/constants/Project'
import { FC } from 'react'

const FooterContent = () => {
  return (
    <p className="inline-block flex-grow text-center text-xs text-gray-500">
      RetroPanel accounting workspace ·{' '}
      <a className="text-blue-400" href={REPO_URL} target="_blank" rel="noreferrer">
        Repository
      </a>
    </p>
  )
}

export const Footer: FC = ({ ...props }) => {
  return (
    <div className="relative flex w-full pt-1 pb-3" {...props}>
      <FooterContent />
    </div>
  )
}
