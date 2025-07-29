import { Link } from 'react-router-dom'
import { Product } from 'shared'
import { 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon,
  UserIcon,
  TagIcon,
  PlayIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price} XMR`
  }

  const getTypeIcon = () => {
    return product.type === 'GAME' ? 
      <PlayIcon className="h-4 w-4" /> : 
      <DevicePhoneMobileIcon className="h-4 w-4" />
  }

  const getTypeLabel = () => {
    return product.type === 'GAME' ? 'Game' : 'App'
  }

  return (
    <div className="game-card">
      <div className="relative">
        <img
          src={product.imageUrl || 'https://picsum.photos/400/300?random=' + product.id}
          alt={product.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
            product.type === 'GAME' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.price === 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <UserIcon className="h-4 w-4" />
            <span>{product.developer.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>{product.downloadCount} downloads</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <TagIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{product.category}</span>
          </div>
          {product.price > 0 && (
            <div className="flex items-center space-x-1 text-primary-600">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="font-medium">{product.price} XMR</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{product.tags.length - 3} more
            </span>
          )}
        </div>

        <Link
          to={`/product/${product.id}`}
          className="block w-full text-center btn-primary"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

// Backward compatibility
export const GameCard = ProductCard;
export default ProductCard; 