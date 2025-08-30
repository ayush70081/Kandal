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
                  <a href="#" aria-label="Twitter" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="Facebook" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="Instagram" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="LinkedIn" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="YouTube" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
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
