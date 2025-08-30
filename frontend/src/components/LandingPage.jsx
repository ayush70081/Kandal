import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    // Handle scroll effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Initialize visible sections immediately
    setVisibleSections(new Set(['home', 'about', 'features', 'how-it-works', 'impact', 'contact']));

    // Intersection Observer for animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
            
            // Animate counters when hero section is visible
            if (entry.target.id === 'home') {
              setTimeout(() => {
                const counters = document.querySelectorAll('.counter');
                counters.forEach(counter => {
                  const target = parseInt(counter.closest('.stat').dataset.count);
                  const increment = target / 100;
                  let current = 0;
                  
                  const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                      counter.textContent = target.toLocaleString() + '+';
                      clearInterval(timer);
                    } else {
                      counter.textContent = Math.floor(current).toLocaleString() + '+';
                    }
                  }, 20);
                });
              }, 500);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all sections after a short delay to ensure DOM is ready
    setTimeout(() => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        if (observerRef.current) {
          observerRef.current.observe(section);
        }
      });
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="loader-content">
          <div className="loader-icon">🌿</div>
          <div className="loader-text">Mangrove Guardian</div>
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <span className="nav-logo">🌿</span>
            <span className="nav-title">Mangrove Guardian</span>
          </div>
          
          <div className={`nav-menu ${isMobileMenuOpen ? 'nav-menu-active' : ''}`}>
            <button className="nav-link" onClick={() => scrollToSection('home')}>Home</button>
            <button className="nav-link" onClick={() => scrollToSection('about')}>About</button>
            <button className="nav-link" onClick={() => scrollToSection('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button className="nav-link" onClick={() => scrollToSection('impact')}>Impact</button>
            <button className="nav-link" onClick={() => scrollToSection('contact')}>Contact</button>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="nav-btn nav-btn-outline">Login</Link>
            <Link to="/register" className="nav-btn nav-btn-primary">Sign Up</Link>
          </div>

          <button 
            className="nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className={`hero-section ${visibleSections.has('home') ? 'animate-in' : ''}`}>
        <div className="hero-background">
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`particle particle-${i % 4 + 1}`}></div>
            ))}
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span>🌍 Environmental Conservation Platform</span>
            </div>
            <h1 className="hero-title">
              Protect Our <span className="text-gradient">Mangrove</span> Ecosystems
            </h1>
            <p className="hero-description">
              Join a global community of environmental guardians. Report incidents, 
              monitor conservation efforts, and make a real impact in preserving 
              coastal ecosystems through our advanced monitoring platform.
            </p>
            
            <div className="hero-stats">
              <div className="stat" data-count="2500">
                <span className="stat-number counter">0+</span>
                <span className="stat-label">Active Guardians</span>
              </div>
              <div className="stat" data-count="1200">
                <span className="stat-number counter">0+</span>
                <span className="stat-label">Reports Filed</span>
              </div>
              <div className="stat" data-count="85">
                <span className="stat-number counter">0+</span>
                <span className="stat-label">Protected Areas</span>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                <span>Start Protecting Now</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <button className="btn btn-outline btn-large" onClick={() => scrollToSection('about')}>
                Learn More
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <div className="floating-elements">
                <div className="floating-icon icon-1">🌿</div>
                <div className="floating-icon icon-2">🌱</div>
                <div className="floating-icon icon-3">🌳</div>
                <div className="floating-icon icon-4">🌊</div>
                <div className="floating-icon icon-5">🐟</div>
                <div className="floating-icon icon-6">🦀</div>
              </div>
              <div className="hero-illustration">
                <div className="mangrove-tree">
                  <div className="tree-trunk"></div>
                  <div className="tree-roots"></div>
                  <div className="tree-canopy"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* About Section */}
      <section id="about" className={`about-section ${visibleSections.has('about') ? 'animate-in' : ''}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Safeguarding Nature's Coastal Protectors</h2>
            <p className="section-subtitle">
              Mangroves are among Earth's most productive ecosystems, protecting coastlines 
              and supporting biodiversity. Our platform empowers communities to monitor, report, 
              and protect these vital ecosystems.
            </p>
          </div>

          <div className="about-content">
            <div className="about-grid">
              <div className="about-card">
                <div className="about-icon">🌊</div>
                <h3>Coastal Protection</h3>
                <p>Mangroves act as natural barriers against storms, tsunamis, and coastal erosion, protecting millions of people worldwide.</p>
              </div>
              <div className="about-card">
                <div className="about-icon">🐠</div>
                <h3>Marine Biodiversity</h3>
                <p>These ecosystems serve as nurseries for fish and habitat for countless species, supporting marine food chains.</p>
              </div>
              <div className="about-card">
                <div className="about-icon">💨</div>
                <h3>Carbon Storage</h3>
                <p>Mangroves store 3-4 times more carbon than terrestrial forests, making them crucial for climate change mitigation.</p>
              </div>
              <div className="about-card">
                <div className="about-icon">👥</div>
                <h3>Community Livelihoods</h3>
                <p>Over 120 million people depend on mangroves for their livelihoods through fishing, tourism, and coastal protection.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Features Section */}
      <section id="features" className={`features-section ${visibleSections.has('features') ? 'animate-in' : ''}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Comprehensive Conservation Tools</h2>
            <p className="section-subtitle">
              Our platform provides everything you need to monitor, report, and protect mangrove ecosystems effectively.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Incident Reporting</h3>
              <p>Report threats, damage, or illegal activities with photo evidence, GPS coordinates, and detailed descriptions.</p>
              <ul>
                <li>Photo & video documentation</li>
                <li>GPS location tracking</li>
                <li>Incident categorization</li>
                <li>Real-time notifications</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Interactive Mapping</h3>
              <p>Visualize incidents, protected areas, and conservation activities on dynamic, real-time maps.</p>
              <ul>
                <li>Real-time incident mapping</li>
                <li>Protected area boundaries</li>
                <li>Heat maps and analytics</li>
                <li>Satellite imagery integration</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Gamified Rewards</h3>
              <p>Earn points, badges, and recognition for your conservation contributions and community engagement.</p>
              <ul>
                <li>Achievement badges</li>
                <li>Leaderboards</li>
                <li>Conservation challenges</li>
                <li>Community recognition</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data Analytics</h3>
              <p>Track conservation progress, analyze trends, and measure environmental impact with detailed analytics.</p>
              <ul>
                <li>Conservation metrics</li>
                <li>Trend analysis</li>
                <li>Impact reports</li>
                <li>Data visualization</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Community Network</h3>
              <p>Connect with conservationists, researchers, and local communities working to protect mangrove ecosystems.</p>
              <ul>
                <li>User profiles & networking</li>
                <li>Discussion forums</li>
                <li>Collaboration tools</li>
                <li>Expert consultations</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Educational Resources</h3>
              <p>Access comprehensive guides, research papers, and educational materials about mangrove conservation.</p>
              <ul>
                <li>Conservation guides</li>
                <li>Scientific research</li>
                <li>Best practices</li>
                <li>Training materials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* How It Works Section */}
      <section id="how-it-works" className={`how-it-works-section ${visibleSections.has('how-it-works') ? 'animate-in' : ''}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple Steps to Make an Impact</h2>
            <p className="section-subtitle">
              Getting started with mangrove conservation is easy. Follow these simple steps to begin protecting coastal ecosystems.
            </p>
          </div>

          <div className="steps-container">
            <div className="steps-flow">
              <div className="step step-1">
                <div className="step-number">1</div>
                <div className="step-icon">👤</div>
                <div className="step-content">
                  <h3>Sign Up & Join</h3>
                  <p>Create your account and join our community of environmental guardians.</p>
                </div>
                <div className="step-connector"></div>
              </div>
              
              <div className="step step-2">
                <div className="step-number">2</div>
                <div className="step-icon">🔍</div>
                <div className="step-content">
                  <h3>Explore & Learn</h3>
                  <p>Discover locations, learn conservation techniques, and understand ecosystems.</p>
                </div>
                <div className="step-connector"></div>
              </div>
              
              <div className="step step-3">
                <div className="step-number">3</div>
                <div className="step-icon">📊</div>
                <div className="step-content">
                  <h3>Report & Monitor</h3>
                  <p>Document incidents, track changes, and report threats using our tools.</p>
                </div>
                <div className="step-connector"></div>
              </div>
              
              <div className="step step-4">
                <div className="step-number">4</div>
                <div className="step-icon">🤝</div>
                <div className="step-content">
                  <h3>Collaborate & Protect</h3>
                  <p>Work with communities, researchers, and authorities for conservation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Impact Section */}
      <section id="impact" className={`impact-section ${visibleSections.has('impact') ? 'animate-in' : ''}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Making a Real Difference</h2>
            <p className="section-subtitle">
              Together, we're creating measurable impact in mangrove conservation and coastal protection worldwide.
            </p>
          </div>

          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-icon">📈</div>
              <div className="impact-number">2,847</div>
              <div className="impact-label">Incidents Reported</div>
              <div className="impact-description">Environmental threats documented and addressed</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon">👥</div>
              <div className="impact-number">1,523</div>
              <div className="impact-label">Active Guardians</div>
              <div className="impact-description">Dedicated conservationists monitoring ecosystems</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon">🌍</div>
              <div className="impact-number">127</div>
              <div className="impact-label">Protected Areas</div>
              <div className="impact-description">Mangrove sites under active monitoring</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon">📊</div>
              <div className="impact-number">89%</div>
              <div className="impact-label">Response Rate</div>
              <div className="impact-description">Incidents receiving timely action</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon">🏆</div>
              <div className="impact-number">45</div>
              <div className="impact-label">Success Stories</div>
              <div className="impact-description">Documented conservation victories</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon">🌱</div>
              <div className="impact-number">12K</div>
              <div className="impact-label">Trees Protected</div>
              <div className="impact-description">Mangrove trees saved from destruction</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Voices from Our Community</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Mangrove Guardian has revolutionized how we monitor coastal ecosystems. The real-time reporting system helped us prevent illegal logging in our protected area."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">🧑‍🔬</div>
                <div className="author-info">
                  <div className="author-name">Dr. Sarah Chen</div>
                  <div className="author-title">Marine Biologist</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a local fisherman, I've seen firsthand how this platform brings communities together to protect our mangroves. It's made a real difference in our area."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">🎣</div>
                <div className="author-info">
                  <div className="author-name">Miguel Rodriguez</div>
                  <div className="author-title">Local Fisherman</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The gamification features keep our students engaged in conservation activities. They're excited to earn badges while learning about environmental protection."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍🏫</div>
                <div className="author-info">
                  <div className="author-name">Prof. Amara Okafor</div>
                  <div className="author-title">Environmental Educator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">🌿</div>
            <h2>Ready to Become a Mangrove Guardian?</h2>
            <p>
              Join our global community of environmental protectors and start making 
              a real impact in coastal conservation today.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Start Your Journey
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
            <div className="cta-features">
              <span>✓ Free to join</span>
              <span>✓ No hidden fees</span>
              <span>✓ Global community</span>
              <span>✓ Real impact</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Contact Section */}
      <section id="contact" className={`contact-section ${visibleSections.has('contact') ? 'animate-in' : ''}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Contact Our Team</h2>
            <p className="section-subtitle">
              Have questions about mangrove conservation or need help with the platform? We're here to help.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email Us</h3>
              <p>support@mangroveguardian.org</p>
              <p>For general inquiries and support</p>
            </div>
            
            <div className="contact-card">
              <div className="contact-icon">🌐</div>
              <h3>Community Forum</h3>
              <p>Join our online community</p>
              <p>Connect with other guardians</p>
            </div>
            
            <div className="contact-card">
              <div className="contact-icon">📱</div>
              <h3>Emergency Reports</h3>
              <p>24/7 incident reporting</p>
              <p>For urgent conservation threats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🌿 Mangrove Guardian</h3>
              <p>Protecting coastal ecosystems through community monitoring and conservation efforts worldwide.</p>
              <div className="footer-social">
                <span>Follow us:</span>
                <div className="social-links">
                  <a href="#" aria-label="Twitter">🐦</a>
                  <a href="#" aria-label="Facebook">📘</a>
                  <a href="#" aria-label="Instagram">📷</a>
                  <a href="#" aria-label="LinkedIn">💼</a>
                </div>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Platform</h4>
                <Link to="/login">Login</Link>
                <Link to="/register">Sign Up</Link>
                <button onClick={() => scrollToSection('features')}>Features</button>
                <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              </div>
              <div className="footer-section">
                <h4>Resources</h4>
                <button onClick={() => scrollToSection('about')}>About</button>
                <button onClick={() => scrollToSection('impact')}>Impact</button>
                <a href="#help">Help Center</a>
                <a href="#docs">Documentation</a>
              </div>
              <div className="footer-section">
                <h4>Community</h4>
                <a href="#forum">Forum</a>
                <a href="#blog">Blog</a>
                <a href="#events">Events</a>
                <button onClick={() => scrollToSection('contact')}>Contact</button>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
                <a href="#cookies">Cookie Policy</a>
                <a href="#security">Security</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Mangrove Guardian. All rights reserved. Made with 💚 for our planet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
