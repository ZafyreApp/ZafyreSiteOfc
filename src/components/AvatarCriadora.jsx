import React from 'react'

function AvatarCriadora({ src, alt = 'Avatar da criadora', size = 100 }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #a855f7'
      }}
    />
  )
}

export default AvatarCriadora
