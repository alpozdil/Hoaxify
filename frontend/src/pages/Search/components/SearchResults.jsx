import { useState, useEffect } from "react";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { UserSearchResults } from "./UserSearchResults";
import { PostSearchResults } from "./PostSearchResults";
import { AllSearchResults } from "./AllSearchResults";
import { searchUsers, searchPosts, searchAll } from "@/shared/api/search";

export function SearchResults({ keyword, activeTab }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword && keyword.trim()) {
      performSearch();
    }
  }, [keyword, activeTab]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      switch (activeTab) {
        case 'users':
          response = await searchUsers(keyword);
          break;
        case 'posts':
          response = await searchPosts(keyword);
          break;
        case 'all':
        default:
          response = await searchAll(keyword);
          break;
      }

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Arama sırasında hata oluştu");
      console.error("Arama hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Spinner />
          <p className="mt-3 text-muted">Aranıyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <Alert styleType="danger">{error}</Alert>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Sekmeye göre uygun bileşeni render et
  switch (activeTab) {
    case 'users':
      return <UserSearchResults users={results} keyword={keyword} />;
    case 'posts':
      return <PostSearchResults posts={results} keyword={keyword} />;
    case 'all':
    default:
      return <AllSearchResults results={results} keyword={keyword} />;
  }
} 