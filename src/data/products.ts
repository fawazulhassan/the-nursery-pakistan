import monsteraImg from "@/assets/product-monstera.jpg";
import snakePlantImg from "@/assets/product-snake-plant.jpg";
import fiddleLeafImg from "@/assets/product-fiddle-leaf.jpg";
import succulentsImg from "@/assets/product-succulents.jpg";
import peaceLilyImg from "@/assets/product-peace-lily.jpg";
import pothosImg from "@/assets/product-pothos.jpg";
import terracottaPotImg from "@/assets/product-terracotta-pot.jpg";
import fertilizerImg from "@/assets/product-fertilizer.jpg";

export interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
}

export const products: Product[] = [
  // Indoor Plants
  {
    id: 1,
    name: "Monstera Deliciosa",
    price: "Rs 2,500",
    rating: 4.8,
    reviews: 120,
    image: monsteraImg,
    category: "Indoor Plants",
    description: "Large tropical plant with iconic split leaves, perfect for bright indirect light.",
    inStock: true,
  },
  {
    id: 2,
    name: "Snake Plant",
    price: "Rs 1,200",
    rating: 4.9,
    reviews: 156,
    image: snakePlantImg,
    category: "Indoor Plants",
    description: "Low-maintenance air purifier, thrives in low light conditions.",
    inStock: true,
  },
  {
    id: 3,
    name: "Fiddle Leaf Fig",
    price: "Rs 3,800",
    rating: 4.7,
    reviews: 89,
    image: fiddleLeafImg,
    category: "Indoor Plants",
    description: "Statement plant with large violin-shaped leaves, loves bright light.",
    inStock: true,
  },
  {
    id: 4,
    name: "Peace Lily",
    price: "Rs 1,500",
    rating: 4.8,
    reviews: 134,
    image: peaceLilyImg,
    category: "Indoor Plants",
    description: "Elegant flowering plant that indicates when it needs water.",
    inStock: true,
  },
  {
    id: 5,
    name: "Golden Pothos",
    price: "Rs 900",
    rating: 4.9,
    reviews: 201,
    image: pothosImg,
    category: "Indoor Plants",
    description: "Trailing vine perfect for hanging baskets, very easy to care for.",
    inStock: true,
  },
  {
    id: 6,
    name: "Succulent Collection",
    price: "Rs 800",
    rating: 4.9,
    reviews: 178,
    image: succulentsImg,
    category: "Indoor Plants",
    description: "Assorted succulent varieties in small pots, drought-tolerant.",
    inStock: true,
  },

  // Outdoor Plants
  {
    id: 7,
    name: "Bougainvillea",
    price: "Rs 1,800",
    rating: 4.7,
    reviews: 92,
    image: monsteraImg,
    category: "Outdoor Plants",
    description: "Vibrant flowering vine, perfect for Pakistani climate.",
    inStock: true,
  },
  {
    id: 8,
    name: "Jasmine Plant",
    price: "Rs 1,200",
    rating: 4.8,
    reviews: 145,
    image: snakePlantImg,
    category: "Outdoor Plants",
    description: "Fragrant flowering plant, thrives in full sun.",
    inStock: true,
  },

  // Pots & Accessories
  {
    id: 9,
    name: "Terracotta Pot Set",
    price: "Rs 1,500",
    rating: 4.6,
    reviews: 78,
    image: terracottaPotImg,
    category: "Pots & Accessories",
    description: "Set of 3 handcrafted terracotta pots with drainage holes.",
    inStock: true,
  },
  {
    id: 10,
    name: "Modern Ceramic Planter",
    price: "Rs 2,200",
    rating: 4.8,
    reviews: 65,
    image: terracottaPotImg,
    category: "Pots & Accessories",
    description: "Minimalist white ceramic planter with wooden stand.",
    inStock: true,
  },

  // Fertilizers & Soil
  {
    id: 11,
    name: "Organic Fertilizer",
    price: "Rs 600",
    rating: 4.7,
    reviews: 112,
    image: fertilizerImg,
    category: "Fertilizers & Soil",
    description: "100% organic plant food for healthy growth.",
    inStock: true,
  },
  {
    id: 12,
    name: "Premium Potting Mix",
    price: "Rs 450",
    rating: 4.8,
    reviews: 156,
    image: fertilizerImg,
    category: "Fertilizers & Soil",
    description: "Well-draining soil mix perfect for indoor plants.",
    inStock: true,
  },

  // Sale Items
  {
    id: 13,
    name: "Monstera Bundle Deal",
    price: "Rs 2,000",
    originalPrice: "Rs 2,500",
    rating: 4.8,
    reviews: 89,
    image: monsteraImg,
    category: "Sale",
    description: "Monstera plant with free ceramic pot.",
    inStock: true,
  },
  {
    id: 14,
    name: "Starter Plant Kit",
    price: "Rs 1,800",
    originalPrice: "Rs 2,400",
    rating: 4.9,
    reviews: 145,
    image: succulentsImg,
    category: "Sale",
    description: "3 easy-care plants with pots and soil.",
    inStock: true,
  },
];

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((product) => product.category === category);
};
