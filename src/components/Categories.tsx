import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shirt, Footprints, Laptop, Sparkles, Sofa, Home, Dumbbell, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    icon: Shirt,
    title: "Clothing",
    description: "Fashion for men, women, and children",
    count: "500+ Items",
    gradient: "from-blue-500 to-blue-600",
    category: "clothing"
  },
  {
    icon: Footprints,
    title: "Shoes",
    description: "Footwear for every occasion and style",
    count: "300+ Pairs",
    gradient: "from-purple-500 to-purple-600",
    category: "shoes"
  },
  {
    icon: Laptop,
    title: "Electronics",
    description: "Latest technology and gadgets",
    count: "250+ Products",
    gradient: "from-green-500 to-green-600",
    category: "electronics"
  },
  {
    icon: Sparkles,
    title: "Beauty & Care",
    description: "Skincare, makeup, and personal care",
    count: "200+ Products",
    gradient: "from-pink-500 to-pink-600",
    category: "beauty"
  },
  {
    icon: Sofa,
    title: "Furniture",
    description: "Comfortable and stylish home furniture",
    count: "150+ Items",
    gradient: "from-orange-500 to-orange-600",
    category: "furniture"
  },
  {
    icon: Home,
    title: "Home & Kitchen",
    description: "Everything for your home and kitchen",
    count: "400+ Products",
    gradient: "from-red-500 to-red-600",
    category: "home"
  },
  {
    icon: Dumbbell,
    title: "Sports & Outdoors",
    description: "Equipment for fitness and outdoor activities",
    count: "180+ Items",
    gradient: "from-indigo-500 to-indigo-600",
    category: "sports"
  },
  {
    icon: ShoppingBag,
    title: "All Products",
    description: "Browse our complete product catalog",
    count: "2000+ Items",
    gradient: "from-gray-500 to-gray-600",
    category: "all"
  }
];

const Categories = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover everything you need in one place - from fashion and electronics to home essentials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={index} 
                className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full text-left"
                onClick={() => navigate(`/products?category=${category.category}`)}
              >
                <Card className="border-border/50 hover:border-primary/30 h-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                        <p className="text-primary font-medium text-sm">
                          {category.count}
                        </p>
                      </div>

                      <Button 
                        variant="tech" 
                        size="sm" 
                        className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products?category=${category.category}`);
                        }}
                      >
                        Browse {category.title}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;