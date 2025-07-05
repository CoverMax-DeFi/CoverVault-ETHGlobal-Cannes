import Navbar from '@/components/Navbar';
import InsuranceCalculator from '@/components/InsuranceCalculator';

const Insurance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Navbar />

      <div className="relative z-10 container mx-auto px-6 py-8">

        


        {/* Quick Overview */}
        

        {/* Interactive Calculator */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Interactive Protocol Demo</h2>
          <InsuranceCalculator />
        </div>

      </div>
    </div>
  );
};

export default Insurance;