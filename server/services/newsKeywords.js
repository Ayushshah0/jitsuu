// Predefined categories and keywords for news preferences
const newsCategories = {
  main: [
    'Politics',
    'Business',
    'Technology',
    'Sports',
    'Entertainment',
    'Health',
    'Science',
    'Education',
    'Environment',
    'World News',
    'National News',
    'Local News'
  ],
  
  technology: [
    'AI',
    'Startups',
    'Cybersecurity',
    'Mobile',
    'Gadgets',
    'Software',
    'Internet',
    'Robotics',
    'Space Tech',
    'Data Science'
  ],
  
  sports: [
    'Cricket',
    'Football',
    'Olympics',
    'Tennis',
    'Badminton',
    'Kabaddi',
    'IPL',
    'World Cup',
    'Player Transfer',
    'Match Results'
  ],
  
  entertainment: [
    'Bollywood',
    'Hollywood',
    'OTT',
    'Movies',
    'Web Series',
    'Celebrity News',
    'Music',
    'TV Shows',
    'Trailers',
    'Awards'
  ],
  
  business: [
    'Stock Market',
    'Cryptocurrency',
    'Economy',
    'Banking',
    'Inflation',
    'Budget',
    'Startups Funding',
    'Real Estate',
    'Trade',
    'Companies'
  ],
  
  health: [
    'COVID-19',
    'Fitness',
    'Nutrition',
    'Mental Health',
    'Medicine',
    'Diseases',
    'Vaccines',
    'Hospitals',
    'Yoga',
    'Lifestyle'
  ],
  
  trending: [
    'Breaking News',
    'Latest Updates',
    'Viral',
    'Trending',
    'Live',
    'Exclusive',
    'Analysis',
    'Opinion',
    'Headlines',
    'Top Stories'
  ]
};

// Flatten all keywords for enum validation
const allKeywords = Object.values(newsCategories).flat();

module.exports = {
  newsCategories,
  allKeywords
};
