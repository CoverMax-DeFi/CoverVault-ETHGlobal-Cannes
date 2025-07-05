import { Link } from 'react-router-dom';
import Logo from '@/assets/images/CoverVault.svg';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Zap,
  Lock,
  BarChart3,
  Globe,
  Layers
} from 'lucide-react';

const Index = () => {
  // Demo stats
  const totalValueLocked = "0";
  const estimatedAPY = "12.5"; // Demo APY
  const isConnected = false;
  const emergencyMode = false;

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk-Adjusted Yields",
      description: "Earn competitive returns while protecting your downside with our dual-token architecture"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Phased Protection",
      description: "Time-based cycles ensure fair claims processing and optimal capital efficiency"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Emergency Safeguards",
      description: "Automatic emergency mode prioritizes senior token holders during market stress"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Transparent Analytics",
      description: "Real-time protocol metrics and performance tracking for informed decisions"
    }
  ];

  const stats = [
    { label: "Total Value Locked", value: `$${totalValueLocked || "0"}`, suffix: "" },
    { label: "Est. APY", value: estimatedAPY, suffix: "%" },
    { label: "Protocol Phases", value: "4", suffix: "" },
    { label: "Emergency Mode", value: emergencyMode ? "Active" : "Ready", suffix: "" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img src={Logo} alt="CoverVault" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">CoverVault</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link to="/insurance" className="text-slate-300 hover:text-white transition-colors">
                Documentation
              </Link>
              <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">
                Analytics
              </Link>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link to="/dashboard">
                  {isConnected ? 'Dashboard' : 'Launch App'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-slate-800 text-slate-200 border-slate-700 px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              Live on Blockchain
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Insurance-Backed
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DeFi Yields
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Earn protected yields through our innovative dual-token system. 
              Senior tokens get priority claims, junior tokens capture upside potential.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                <Link to="/dashboard">
                  Start Earning
                  <TrendingUp className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500 text-lg px-8 py-6">
                <Link to="/insurance">
                  Learn More
                </Link>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 bg-slate-800/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Risk Management
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Advanced protocols designed to balance yield generation with capital protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How CoverVault Works
            </h2>
            <p className="text-slate-300 text-lg">
              Simple steps to start earning protected yields
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Deposit Assets</h3>
              <p className="text-slate-300">
                Deposit aUSDC or cUSDT during the deposit phase to receive equal amounts of senior and junior tokens
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Earn Yield</h3>
              <p className="text-slate-300">
                Your assets generate yield during the coverage phase while being protected by the insurance mechanism
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Claim Rewards</h3>
              <p className="text-slate-300">
                Withdraw your principal plus yields during the claims phases based on your token priority
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Phases */}
      <section className="relative z-10 py-24 bg-slate-800/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Protocol Phases
            </h2>
            <p className="text-slate-300 text-lg">
              Time-based cycles ensure fair and efficient operations
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { phase: "Deposit", duration: "2 days", description: "Users deposit assets and receive CM tokens", color: "from-green-600 to-emerald-600" },
              { phase: "Coverage", duration: "3 days", description: "Assets earn yield while locked and protected", color: "from-blue-600 to-cyan-600" },
              { phase: "Claims", duration: "1 day", description: "Senior token holders can withdraw first", color: "from-orange-600 to-amber-600" },
              { phase: "Final Claims", duration: "1 day", description: "All remaining tokens can be withdrawn", color: "from-red-600 to-rose-600" }
            ].map((phase, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-all duration-300">
                <div className={`w-full h-2 bg-gradient-to-r ${phase.color} rounded-full mb-4`}></div>
                <h3 className="text-lg font-semibold text-white mb-2">{phase.phase}</h3>
                <p className="text-blue-400 text-sm font-medium mb-2">{phase.duration}</p>
                <p className="text-slate-300 text-sm">{phase.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Connect your wallet and experience the future of protected DeFi yields. 
              No KYC required, just pure decentralized finance.
            </p>
            
            <div className="flex items-center justify-center space-x-6 mb-8">
              {[
                { icon: <Lock className="w-5 h-5" />, label: "Non-custodial" },
                { icon: <Shield className="w-5 h-5" />, label: "Protected" },
                { icon: <Layers className="w-5 h-5" />, label: "Dual-token" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-slate-300">
                  <div className="text-blue-400">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
              <Link to="/dashboard">
                Launch CoverVault
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src={Logo} alt="CoverVault" className="h-6 w-auto" />
                <span className="text-lg font-bold text-white">CoverVault</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Insurance-backed DeFi yields through innovative dual-token architecture.
                Built for the future of protected finance.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Protocol</h4>
              <div className="space-y-2">
                <Link to="/dashboard" className="block text-slate-400 hover:text-white transition-colors">Dashboard</Link>
                <Link to="/insurance" className="block text-slate-400 hover:text-white transition-colors">Documentation</Link>
                <Link to="/admin" className="block text-slate-400 hover:text-white transition-colors">Analytics</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Whitepaper</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Audit</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} CoverVault Protocol. Decentralized and open source.
            </p>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;