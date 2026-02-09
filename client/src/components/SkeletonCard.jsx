function SkeletonCard() {
  return (
    <div className="article-card">
      <div className="w-full h-[220px] bg-gray-200 animate-pulse" />
      <div className="article-content">
        <div className="h-5 bg-gray-200 rounded w-4/5 mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-11/12 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
        <div className="article-footer">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
