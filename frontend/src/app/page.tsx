"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ArrowRight, BookOpen, CheckCircle2, Layout, UploadCloud, Cpu, Award } from "lucide-react";

export default function Home() {
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <main className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-red-500/30 overflow-x-hidden">
            
            {/* Navbar */}
            <header
                className={`fixed w-full z-50 transition-all duration-300 ${
                    isScrolled
                        ? "bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-3"
                        : "bg-transparent py-5"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8">
                            <img
                                src="/images/logo.png"
                                alt="AcaRead Logo"
                                className="w-full h-full object-contain relative z-10"
                            />
                            <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Aca<span className="text-slate-400 font-normal">Read</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
                            <a href="#how" className="hover:text-white transition-colors">How it Works</a>
                            <a href="#features" className="hover:text-white transition-colors">Features</a>
                        </nav>
                        
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                             {session ? (
                                <UserMenu />
                            ) : (
                                <UserMenu />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6">
                {/* Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-red-900/10 via-red-900/5 to-transparent pointer-events-none"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-8 animate-fade-in-up">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        v2.2 is now live
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
                        Turn Academic Papers into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                            IELTS Practice Tests
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Don't just read passively. <strong>AcaRead</strong> uses AI to transform your research papers into structured reading comprehension exams. Test your understanding while mastering academic English.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/create"
                            className="h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            Try it out
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#demo"
                            className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors flex items-center"
                        >
                            View Demo
                        </a>
                    </div>
                </div>

                {/* UI Mockup */}
                <div className="mt-20 max-w-6xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden">
                        {/* Mockup Header */}
                        <div className="h-10 border-b border-white/5 bg-[#111] flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                            </div>
                            <div className="bg-white/5 px-3 py-1 rounded text-[10px] text-slate-500 flex-1 text-center max-w-[200px] mx-auto">
                                acaread.com/exam/sample-test
                            </div>
                        </div>
                        {/* Mockup Content - Split View */}
                        <div className="grid grid-cols-12 h-[400px] lg:h-[600px] divide-x divide-white/5 text-left">
                            {/* Left: Reading Passage */}
                            <div className="col-span-12 md:col-span-6 p-8 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A] pointer-events-none"></div>
                                <h3 className="text-xl font-serif font-bold text-slate-200 mb-4">The Future of Generative AI in Education</h3>
                                <div className="space-y-4 text-slate-400 text-sm leading-7 font-serif">
                                    <p><span className="text-red-500 font-bold mr-2">A</span>Recent advancements in large language models (LLMs) have precipitated a paradigm shift in educational methodologies. The integration of AI-driven tools into the classroom is not merely an incremental update but a fundamental restructuring of how knowledge is disseminated and assessed.</p>
                                    <p><span className="text-red-500 font-bold mr-2">B</span>While proponents argue that personalized learning pathways are now accessible at scale, critics maintain that over-reliance on algorithmic instruction may erode critical thinking skills. The "illusion of competence," where students mistake fluent AI outputs for their own understanding, remains a significant pedagogical challenge.</p>
                                    <p className="opacity-50"><span className="text-red-500 font-bold mr-2">C</span>Furthermore, the question of academic integrity has moved beyond simple plagiarism detection. Educators must now design assessments that evaluate the process of reasoning rather than the final product...</p>
                                </div>
                            </div>
                            {/* Right: Questions */}
                            <div className="hidden md:block col-span-6 bg-[#0F0F0F] p-8">
                                <div className="mb-6">
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Question 1-4</span>
                                    <h4 className="text-white font-medium mt-1">True / False / Not Given</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <p className="text-sm text-slate-300 mb-3">1. The integration of AI in education represents only a minor change to existing teaching methods.</p>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-1 rounded border border-red-500/50 bg-red-500/10 text-red-400 text-xs font-medium">FALSE</div>
                                            <div className="px-3 py-1 rounded border border-white/10 text-slate-500 text-xs">TRUE</div>
                                            <div className="px-3 py-1 rounded border border-white/10 text-slate-500 text-xs">NOT GIVEN</div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5 opacity-50">
                                        <p className="text-sm text-slate-300 mb-3">2. Critics are concerned that AI might negatively impact students' ability to think critically.</p>
                                        <div className="flex gap-2">
                                            <div className="w-12 h-6 bg-white/10 rounded"></div>
                                            <div className="w-12 h-6 bg-white/10 rounded"></div>
                                            <div className="w-12 h-6 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Does It - Minimal Steps */}
            <section id="how" className="py-32 px-6 bg-[#080808] border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
                        {/* Step 1 */}
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">1</div>
                                <UploadCloud className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Upload Material</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Upload any PDF, research paper, or technical documentation. AcaRead uses refined OCR to extract clean text, ignoring headers, footers, and references.
                            </p>
                        </div>

                         {/* Step 2 */}
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">2</div>
                                <Cpu className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Structure Analysis</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Our AI isn't just a text generator. It analyzes the logical flow of your document to create meaningful questions that test actual comprehension, not just keyword matching.
                            </p>
                        </div>

                         {/* Step 3 */}
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">3</div>
                                <Layout className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Interactive Exam</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Take the test in a dedicated interface. Get instant grading, detailed explanations for every answer, and track your progress over time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Grid - Serious */}
            <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-16 items-start">
                    <div className="md:w-1/3 py-8 sticky top-24">
                        <h2 className="text-4xl font-bold text-white mb-6">Built for Serious Learners</h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8">
                            AcaRead is designed for students, researchers, and professionals who need to digest complex information deeply.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500" />
                                <span>IELTS Standard Format</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500" />
                                <span>Scientific Paper Support</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-red-500" />
                                <span>Deep Comprehension Analysis</span>
                            </li>
                        </ul>
                    </div>

                    <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <BookOpen className="w-8 h-8 text-white mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Reading Passages</h3>
                            <p className="text-slate-400 text-sm">Automatically generates 700-1000 word academic passages from your source material, complete with paragraph labelling.</p>
                        </div>
                        <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <Award className="w-8 h-8 text-white mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">9+ Question Types</h3>
                            <p className="text-slate-400 text-sm">Supports Matching Headings, True/False/Not Given, Summary Completion, Multiple Choice, and more to test different reading skills.</p>
                        </div>
                         <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <Layout className="w-8 h-8 text-white mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Focused Mode</h3>
                            <p className="text-slate-400 text-sm">Distraction-free exam interface with split-screen view, keeping the text and questions side-by-side.</p>
                        </div>
                         <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                             <div className="w-8 h-8 text-white font-bold text-xl mb-4">AI</div>
                            <h3 className="text-lg font-bold text-white mb-2">Smart Explanations</h3>
                            <p className="text-slate-400 text-sm">Don't just get a score. Understand WHY an answer is correct with AI-generated reasoning that references specific text evidence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Invest in Your Knowledge</h2>
                        <p className="text-slate-400 text-lg">
                            Simple, transparent pricing. No hidden fees. Start for free, upgrade for power.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Plan 1: Hobby */}
                        <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all group">
                            <h3 className="text-xl font-bold text-white mb-2">Hobby</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500">/forever</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-8">Perfect for trying out the platform and casual practice.</p>
                            <Link href="/create" className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-center rounded-xl font-medium transition-colors mb-8">
                                Get Started
                            </Link>
                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>3 Exams per day</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>Standard AI Speed</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>Basic Reading Types</span>
                                </li>
                            </ul>
                        </div>

                        {/* Plan 2: Pro */}
                        <div className="relative p-8 rounded-2xl bg-[#0F0F0F] border border-red-500/30 ring-1 ring-red-500/20 shadow-2xl shadow-red-900/10 transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Scholar</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$9</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-8">For serious students and researchers needing deep analysis.</p>
                            <Link href="/create" className="block w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white text-center rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 mb-8">
                                Upgrade to Scholar
                            </Link>
                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    <span>Unlimited Exams</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    <span>Deep Context Analysis</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    <span>Priority Graphics Processing</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    <span>Export to PDF/Anki</span>
                                </li>
                            </ul>
                        </div>

                        {/* Plan 3: Team */}
                        <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all">
                            <h3 className="text-xl font-bold text-white mb-2">Research Review</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$29</span>
                                <span className="text-slate-500">/one-time</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-8">One-off deep audit for a specific paper or thesis.</p>
                            <button className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-center rounded-xl font-medium transition-colors mb-8">
                                Contact Sales
                            </button>
                             <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>Single 100+ Page Document</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>Human-Verified Questions</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                    <span>Citation Analysis</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRO Footer */}
            <footer className="relative z-10 bg-[#020202] border-t border-white/5 pt-20 pb-10 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="relative w-8 h-8">
                                <img
                                    src="/images/logo.png"
                                    alt="AcaRead Logo"
                                    className="w-full h-full object-contain relative z-10"
                                />
                                <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">
                                Aca<span className="text-slate-500 font-normal">Read</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Transforming how students and researchers engage with academic literature. Deep reading, verified understanding.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Placeholders */}
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                            </a>
                            <a href="https://github.com/hoangvu1806" target="_blank" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                                <span className="sr-only">GitHub</span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.029 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Product</h3>
                        <ul className="space-y-4">
                            <li><a href="#features" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Features</a></li>
                            <li><a href="#how" className="text-sm text-slate-400 hover:text-red-500 transition-colors">How it Works</a></li>
                            <li><a href="/create" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Try Demo</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Pricing <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-2">Soon</span></a></li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Resources</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">IELTS Guide</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Blog</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Community</a></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Legal</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-red-500 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-600">
                        &copy; {new Date().getFullYear()} AcaRead Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
                        <span>All Systems Operational</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
