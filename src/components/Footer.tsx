
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleQuickLinkClick = (link: string) => {
    switch (link) {
      case "Clothing":
      case "Shoes":
      case "Electronics":
      case "Beauty":
      case "Furniture":
        navigate(`/products?category=${link.toLowerCase()}`);
        break;
      case "Support":
        window.location.href = "mailto:Masterkaffa762@gmail.com";
        break;
      default:
        navigate('/products');
    }
  };

  const handleCustomerServiceClick = (link: string) => {
    switch (link) {
      case "Contact Us":
        window.location.href = "mailto:Masterkaffa762@gmail.com";
        break;
      case "Live Chat":
        // The live chat is already visible on all pages
        break;
      default:
        // For other links, you can add specific functionality later
        break;
    }
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/e047520e-19b1-47f7-8286-99901fcfc9ab.png" 
                alt="Kaffa Online Store" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-background/80 text-sm">
              Your trusted partner for quality products across all categories. 
              From fashion and electronics to home essentials - we've got everything you need.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2">
              {["Clothing", "Shoes", "Electronics", "Beauty", "Furniture", "Support"].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => handleQuickLinkClick(link)}
                    className="text-background/80 hover:text-background transition-colors text-sm text-left"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Customer Service</h4>
            <ul className="space-y-2">
              {["Contact Us", "Shipping Info", "Returns", "Warranty", "FAQ", "Live Chat"].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => handleCustomerServiceClick(link)}
                    className="text-background/80 hover:text-background transition-colors text-sm text-left"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Stay Connected</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <Phone className="h-4 w-4" />
                <span>0743049549</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <Mail className="h-4 w-4" />
                <span>Masterkaffa762@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <MapPin className="h-4 w-4" />
                <span>Thika Town, Kenya</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-background/80">Subscribe for deals & updates</p>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter email" 
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
                />
                <Button variant="secondary" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-background/60 text-sm">
            © 2025 Kaffa Online Store. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>

        {/* Moving Developer Credit */}
        <div className="mt-4 overflow-hidden bg-background/5 py-2">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-green-400 text-xs">
              This website is designed and developed by Sam. Contact me at email: sammdev.ai@gmail.com, phone: 0707116562 for web designs and development.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
