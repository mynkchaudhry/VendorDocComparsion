import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, FileText, Tag, Zap, CheckCircle, 
  X, Loader, Sparkles, ArrowRight, 
  TrendingUp, Target, Award, Clock
} from 'lucide-react'
import Button from './Button'
import Card from './Card'

const documentCategories = {
  'contract': {
    name: 'Contract',
    icon: FileText,
    color: 'blue',
    description: 'Legal agreements and contracts',
    keywords: ['agreement', 'contract', 'terms', 'conditions', 'legal', 'binding']
  },
  'proposal': {
    name: 'Proposal',
    icon: Target,
    color: 'green',
    description: 'Business proposals and quotes',
    keywords: ['proposal', 'quote', 'estimate', 'bid', 'offer', 'pricing']
  },
  'invoice': {
    name: 'Invoice',
    icon: TrendingUp,
    color: 'purple',
    description: 'Bills and payment documents',
    keywords: ['invoice', 'bill', 'payment', 'due', 'amount', 'total']
  },
  'technical': {
    name: 'Technical',
    icon: Brain,
    color: 'orange',
    description: 'Technical specifications and documentation',
    keywords: ['specification', 'technical', 'manual', 'guide', 'documentation', 'API']
  },
  'compliance': {
    name: 'Compliance',
    icon: Award,
    color: 'red',
    description: 'Compliance and certification documents',
    keywords: ['compliance', 'certification', 'audit', 'regulation', 'standard', 'ISO']
  },
  'other': {
    name: 'Other',
    icon: FileText,
    color: 'gray',
    description: 'Miscellaneous documents',
    keywords: []
  }
}

const SmartCategorization = ({ 
  document, 
  onCategoryAssign, 
  onClose, 
  isOpen = false,
  autoMode = false 
}) => {
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [confidence, setConfidence] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [customTags, setCustomTags] = useState([])

  // Simulate AI analysis
  const analyzeDocument = async () => {
    setAnalyzing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock analysis based on document name/content
    const docName = document?.name?.toLowerCase() || ''
    const docContent = document?.content?.toLowerCase() || ''
    const text = docName + ' ' + docContent
    
    const categoryScores = Object.entries(documentCategories).map(([key, category]) => {
      let score = 0
      category.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1
        }
      })
      
      // Add some randomness for demo
      score += Math.random() * 0.3
      
      return {
        key,
        category,
        score: Math.min(score, 1),
        confidence: Math.round((score * 100) + (Math.random() * 20))
      }
    }).sort((a, b) => b.confidence - a.confidence)

    setSuggestions(categoryScores.slice(0, 3))
    setConfidence(categoryScores[0]?.confidence || 0)
    setSelectedCategory(categoryScores[0]?.key || 'other')
    
    // Generate smart tags
    const smartTags = []
    if (text.includes('urgent')) smartTags.push('urgent')
    if (text.includes('2024') || text.includes('2025')) smartTags.push('recent')
    if (text.includes('draft')) smartTags.push('draft')
    if (text.includes('final')) smartTags.push('final')
    
    setCustomTags(smartTags)
    setAnalyzing(false)
  }

  useEffect(() => {
    if (isOpen && document) {
      analyzeDocument()
    }
  }, [isOpen, document])

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey)
  }

  const handleConfirm = () => {
    if (selectedCategory) {
      onCategoryAssign({
        category: selectedCategory,
        confidence,
        tags: customTags,
        suggestions: suggestions.map(s => s.key)
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-dark-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-dark-primary">
                    Smart Categorization
                  </h3>
                  <p className="text-gray-600 dark:text-dark-muted">
                    AI-powered document analysis
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Document Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-primary">
                    {document?.name || 'Unknown Document'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-dark-muted">
                    Size: {document?.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Analysis Status */}
            {analyzing ? (
              <Card className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-2">
                  Analyzing Document...
                </h4>
                <p className="text-gray-600 dark:text-dark-muted">
                  AI is examining content, structure, and context
                </p>
                <div className="mt-4 w-48 h-2 bg-gray-200 dark:bg-dark-accent rounded-full mx-auto overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </div>
              </Card>
            ) : (
              <>
                {/* Confidence Score */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-dark-primary">
                          Analysis Complete
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-dark-muted">
                          Confidence: {confidence}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${confidence}, 100`}
                            className="text-green-500 dark:text-green-400"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Category Suggestions */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                    Suggested Categories
                  </h4>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => {
                      const Icon = suggestion.category.icon
                      const isSelected = selectedCategory === suggestion.key
                      
                      return (
                        <motion.button
                          key={suggestion.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleCategorySelect(suggestion.key)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-dark-primary hover:border-gray-300 dark:hover:border-dark-accent bg-white dark:bg-dark-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                suggestion.category.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                suggestion.category.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                                suggestion.category.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                suggestion.category.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                suggestion.category.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                                'bg-gray-100 dark:bg-gray-900/30'
                              }`}>
                                <Icon className={`w-5 h-5 ${
                                  suggestion.category.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                  suggestion.category.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                  suggestion.category.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                  suggestion.category.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                                  suggestion.category.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                  'text-gray-600 dark:text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-dark-primary">
                                  {suggestion.category.name}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-dark-muted">
                                  {suggestion.category.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-secondary">
                                {suggestion.confidence}%
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Smart Tags */}
                {customTags.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-blue-500" />
                      Smart Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {customTags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-dark-primary">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={analyzing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirm}
                disabled={analyzing || !selectedCategory}
                icon={analyzing ? Loader : CheckCircle}
                iconPosition="right"
              >
                {analyzing ? 'Analyzing...' : 'Apply Category'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SmartCategorization