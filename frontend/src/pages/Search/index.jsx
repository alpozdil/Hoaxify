import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SearchResults } from "./components/SearchResults";
import { SearchTabs } from "./components/SearchTabs";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");

  // URL'deki parametreleri dinle
  useEffect(() => {
    const urlKeyword = searchParams.get("q") || "";
    const urlTab = searchParams.get("tab") || "all";
    
    setKeyword(urlKeyword);
    setActiveTab(urlTab);
  }, [searchParams]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (keyword.trim()) {
      setSearchParams({ q: keyword.trim(), tab: activeTab });
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (keyword.trim()) {
      setSearchParams({ q: keyword.trim(), tab: newTab });
    }
  };

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value);
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-12">
          {/* Arama Formu */}
          <div className="card mb-3">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="row">
                  <div className="col-10">
                    <Input
                      id="search"
                      placeholder="Kullanıcıları ve gönderileri ara..."
                      value={keyword}
                      onChange={handleKeywordChange}
                    />
                  </div>
                  <div className="col-2">
                    <Button type="submit" className="w-100">
                      Ara
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sonuçlar */}
          {keyword && (
            <>
              <SearchTabs 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                keyword={keyword}
              />
              <SearchResults 
                keyword={keyword} 
                activeTab={activeTab} 
              />
            </>
          )}

          {/* Boş durum */}
          {!keyword && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-search display-1 text-muted"></i>
                <h4 className="mt-3 text-muted">Arama Yap</h4>
                <p className="text-muted">
                  Kullanıcıları ve gönderileri aramak için yukarıdaki arama kutusunu kullanın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 