import Link from 'next/link';
import { Code, Cloud, Sparkles, Globe, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white">CloudCode</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-sm mb-8">
            <Sparkles size={16} />
            <span>AI-Powered Code Editor</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
            Code Anywhere,
            <br />
            Build Anything
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            A powerful cloud-based code editor with AI assistance, live preview, 
            and seamless collaboration. Write, run, and deploy code from any device.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="primary" className="px-8">
                Start Coding Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Editor Preview */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 shadow-2xl overflow-hidden">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 text-center text-sm text-gray-500">
                CloudCode Editor
              </div>
            </div>
            
            {/* Editor mockup */}
            <div className="flex h-96">
              {/* Sidebar */}
              <div className="w-56 border-r border-gray-800 p-3">
                <div className="text-xs text-gray-500 mb-3">EXPLORER</div>
                <div className="space-y-1 text-sm">
                  <div className="px-2 py-1 bg-gray-800 rounded text-blue-400">index.html</div>
                  <div className="px-2 py-1 text-gray-400">styles.css</div>
                  <div className="px-2 py-1 text-gray-400">script.js</div>
                </div>
              </div>
              
              {/* Code area */}
              <div className="flex-1 p-4 font-mono text-sm">
                <div className="text-gray-500">1</div>
                <div><span className="text-pink-400">&lt;!DOCTYPE</span> <span className="text-orange-400">html</span><span className="text-pink-400">&gt;</span></div>
                <div className="text-gray-500">2</div>
                <div><span className="text-pink-400">&lt;html</span> <span className="text-purple-400">lang</span>=<span className="text-green-400">"en"</span><span className="text-pink-400">&gt;</span></div>
                <div className="text-gray-500">3</div>
                <div className="pl-4"><span className="text-pink-400">&lt;head&gt;</span></div>
                <div className="text-gray-500">4</div>
                <div className="pl-8"><span className="text-pink-400">&lt;title&gt;</span><span className="text-gray-300">My App</span><span className="text-pink-400">&lt;/title&gt;</span></div>
                <div className="text-gray-500">5</div>
                <div className="pl-4"><span className="text-pink-400">&lt;/head&gt;</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Powerful features designed for modern development workflows
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Cloud className="text-blue-400" />}
              title="Cloud-Based"
              description="Access your projects from anywhere. Your code syncs automatically across all devices."
            />
            <FeatureCard
              icon={<Sparkles className="text-purple-400" />}
              title="AI Assistant"
              description="Get intelligent code suggestions, explanations, and bug fixes powered by AI."
            />
            <FeatureCard
              icon={<Globe className="text-green-400" />}
              title="Live Preview"
              description="See your changes in real-time with instant preview for HTML, CSS, and JavaScript."
            />
            <FeatureCard
              icon={<Code className="text-orange-400" />}
              title="Monaco Editor"
              description="The same powerful editor that powers VS Code, with syntax highlighting and IntelliSense."
            />
            <FeatureCard
              icon={<Lock className="text-red-400" />}
              title="Secure"
              description="Your code is encrypted and securely stored. Sandboxed execution keeps your system safe."
            />
            <FeatureCard
              icon={<Zap className="text-yellow-400" />}
              title="Fast"
              description="Optimized for performance. Start coding instantly without heavy downloads."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Coding?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of developers who are already building with CloudCode.
          </p>
          <Link href="/register">
            <Button size="lg" variant="primary" className="px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Code size={16} />
            <span>CloudCode</span>
          </div>
          <div>Built with Next.js, Monaco Editor & AI</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
