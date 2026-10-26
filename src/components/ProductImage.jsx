import { useState } from 'react'
import { categoryEmoji } from '../lib/categories'
import { assetUrl } from '../lib/api'

export default function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (product.image && !failed) {
    return (
      <img
        className={className}
        src={assetUrl(product.image)}
        alt={product.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className={`ph ph-${product.category} ${className}`} aria-hidden="true">
      <span>{categoryEmoji(product.category)}</span>
    </div>
  )
}
