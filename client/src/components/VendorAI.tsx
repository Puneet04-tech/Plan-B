"use strict";

import { useState } from "react";

interface VendorRecommendation {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  estimatedCost: number;
  matchScore: number;
  highlights: string[];
  contact: string;
  verified: boolean;
}

interface Props {
  onContactVendor?: (vendor: VendorRecommendation) => void;
}

/**
 * Sample vendor shortlist used by the demo. The data is static on purpose:
 * Plan B does not run a vendor marketplace, so nothing here is fetched or
 * generated at request time.
 */
const VendorAI = ({ onContactVendor }: Props) => {
  const [recommendations] = useState<VendorRecommendation[]>([
    {
      id: "1",
      name: "Royal Cuisine Catering",
      category: "Catering",
      rating: 4.8,
      reviewCount: 234,
      estimatedCost: 120000,
      matchScore: 0.92,
      highlights: [
        "Specializes in Indian cuisine",
        "Flexible menu options",
        "Hybrid service available",
      ],
      contact: "contact@royalcuisine.com",
      verified: true,
    },
    {
      id: "2",
      name: "Bloom & Petal Florists",
      category: "Decor",
      rating: 4.6,
      reviewCount: 156,
      estimatedCost: 75000,
      matchScore: 0.88,
      highlights: ["Fresh flower arrangements", "Custom designs", "Setup included"],
      contact: "info@bloompetal.com",
      verified: true,
    },
    {
      id: "3",
      name: "Lens & Light Photography",
      category: "Photography",
      rating: 4.9,
      reviewCount: 312,
      estimatedCost: 65000,
      matchScore: 0.95,
      highlights: ["Cinematic style", "Drone coverage", "Same-day edits available"],
      contact: "book@lenslight.com",
      verified: true,
    },
    {
      id: "4",
      name: "Rhythm Beats DJ",
      category: "Entertainment",
      rating: 4.5,
      reviewCount: 89,
      estimatedCost: 35000,
      matchScore: 0.85,
      highlights: ["Wide music library", "MC services", "Sound equipment included"],
      contact: "dj@rhythms.com",
      verified: false,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "rating" | "cost">("match");

  const categories = [
    "all",
    "Catering",
    "Decor",
    "Photography",
    "Entertainment",
    "Venue",
  ];

  const filteredVendors = recommendations
    .filter((v) => selectedCategory === "all" || v.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "cost") return a.estimatedCost - b.estimatedCost;
      return 0;
    });

  const getMatchColor = (score: number) => {
    if (score >= 0.9) return "var(--ok)";
    if (score >= 0.8) return "var(--highlight)";
    return "var(--accent)";
  };

  const getStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "");
  };

  return (
    <div className="card vendor-ai">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2>AI Vendor Recommendations</h2>
        <div
          className="chip"
          style={{ background: "var(--pill-bg)", color: "var(--pill-ink)" }}
        >
          AI-Powered
        </div>
      </div>

      <div className="vendor-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "match" | "rating" | "cost")}
            className="filter-select"
          >
            <option value="match">AI Match Score</option>
            <option value="rating">Rating</option>
            <option value="cost">Cost (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="vendor-list">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-header">
              <div className="vendor-info">
                <h3 className="vendor-name">
                  {vendor.name}
                  {vendor.verified && (
                    <span className="verified-badge" title="Verified Vendor">
                      ✓
                    </span>
                  )}
                </h3>
                <div className="vendor-category">{vendor.category}</div>
              </div>
              <div className="vendor-match">
                <div
                  className="match-score"
                  style={{ color: getMatchColor(vendor.matchScore) }}
                >
                  {(vendor.matchScore * 100).toFixed(0)}%
                </div>
                <div className="match-label">AI Match</div>
              </div>
            </div>

            <div className="vendor-stats">
              <div className="stat">
                <span className="stat-label">Rating:</span>
                <span className="stat-value">
                  {getStars(vendor.rating)} ({vendor.rating})
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Reviews:</span>
                <span className="stat-value">{vendor.reviewCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Est. Cost:</span>
                <span className="stat-value">
                  ₹{vendor.estimatedCost.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="vendor-highlights">
              {vendor.highlights.map((highlight, idx) => (
                <span key={idx} className="highlight-tag">
                  {highlight}
                </span>
              ))}
            </div>

            <div className="vendor-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onContactVendor?.(vendor)}
              >
                Contact Vendor
              </button>
              <button className="btn btn-ghost btn-sm">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="empty-state">
          <p>No vendors found for this category. Try selecting a different category.</p>
        </div>
      )}
    </div>
  );
};

export default VendorAI;
