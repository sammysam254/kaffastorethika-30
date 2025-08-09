import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Cpu, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-computers.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative bg-gradient-to-br from-background via-secondary/20 to-accent/10 py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Cutting-Edge
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Technology
                </span>
                at Your Fingertips
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Discover premium computers, laptops, and tech components. 
                Built for performance, designed for innovation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
                onClick={() => navigate('/products')}
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/products')}
              >
                View Catalog
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <Monitor className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Premium Displays</p>
              </div>
              <div className="text-center">
                <Cpu className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Latest Processors</p>
              </div>
              <div className="text-center">
                <HardDrive className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Fast Storage</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-tech transition-shadow duration-500">
              <img 
                src={heroImage} 
                alt="Premium computers and laptops"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-gradient-primary p-6 rounded-xl shadow-glow">
              <p className="text-white font-bold text-lg">Latest Tech</p>
              <p className="text-white/90 text-sm">Premium Quality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;