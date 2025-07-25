import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon, 
  GameController2Icon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
  }

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="page-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <GameController2Icon className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Based Marketplace</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Browse Products
            </Link>
            
            {user ? (
              <>
                <Link to="/my-games" className="text-gray-700 hover:text-primary-600 transition-colors">
                  My Library
                </Link>
                
                {user.role === 'DEVELOPER' && (
                  <>
                    <Link to="/developer" className="text-gray-700 hover:text-primary-600 transition-colors">
                      Dashboard
                    </Link>
                    <Link 
                      to="/developer/create-game" 
                      className="flex items-center space-x-1 btn-primary"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Product</span>
                    </Link>
                  </>
                )}
                
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors">
                    <UserIcon className="h-5 w-5" />
                    <span>{user.username}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CogIcon className="h-4 w-4 inline mr-2" />
                      Profile Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                             <Link 
                 to="/" 
                 className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                 onClick={() => setIsOpen(false)}
               >
                 Browse Products
               </Link>
               
               {user ? (
                 <>
                   <Link 
                     to="/my-games" 
                     className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                     onClick={() => setIsOpen(false)}
                   >
                     My Library
                   </Link>
                  
                  {user.role === 'DEVELOPER' && (
                    <>
                      <Link 
                        to="/developer" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                                             <Link 
                         to="/developer/create-game" 
                         className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                         onClick={() => setIsOpen(false)}
                       >
                         Add Product
                       </Link>
                    </>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 