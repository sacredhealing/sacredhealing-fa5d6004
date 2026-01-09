import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, Lightbulb, Image as ImageIcon, FileText, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCreativeTools } from "@/hooks/useCreativeTools";

export default function CreativeSoulLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useCreativeTools();
  const [demoActive, setDemoActive] = useState(false);

  // Mock demo data for admin/demo access
  const demoText = "This is a demo transcription of your voice. Imagine speaking about your creative vision, and AI transforms it into actionable ideas.";
  const demoIdeas = "1. Write a self-healing journal\n2. Create a digital vision board\n3. Design a meditation poster\n4. Develop a personal affirmation practice";
  const demoImage = "https://via.placeholder.com/400x400/9333EA/FFFFFF?text=Creative+Idea+Image";
  const demoPDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  const handleDemoAccess = () => setDemoActive(true);
  const handleGetStarted = () => {
    if (user && hasAccess('creative-soul-studio')) {
      navigate('/creative-soul-tool/creative-soul-studio');
    } else {
      navigate('/creative-soul');
    }
  };

  const features = [
    {
      icon: Mic,
      title: "Voice Recording",
      description: "Record your voice directly in the browser, no app needed."
    },
    {
      icon: Sparkles,
      title: "AI Transcription",
      description: "Convert your voice to text in any language with Whisper AI."
    },
    {
      icon: Lightbulb,
      title: "Idea Generation",
      description: "Generate creative ideas based on your words using GPT-4."
    },
    {
      icon: ImageIcon,
      title: "Image Creation",
      description: "Create high-quality images with DALL-E 3 from your ideas."
    },
    {
      icon: FileText,
      title: "PDF Export",
      description: "Export your creations as professional PDF documents."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center px-6 py-12 md:py-20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">
            Creative Soul Studio
          </h1>
        </div>
        
        <p className="text-lg md:text-xl text-gray-700 text-center max-w-3xl mb-8 leading-relaxed">
          Transform your voice into <strong className="text-purple-600">creative ideas</strong>, <strong className="text-purple-600">images</strong>, and <strong className="text-purple-600">documents</strong>.  
          Voice-to-text transcription, AI idea generation, image creation, and PDF export—all in one powerful tool.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {!user && (
            <Button
              onClick={handleDemoAccess}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo
            </Button>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-6 mb-12 max-w-6xl">
        <Card className="shadow-xl border-2 border-purple-100">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 p-6 bg-purple-50 rounded-xl">
              <ol className="list-decimal list-inside space-y-3 text-gray-700 max-w-2xl mx-auto">
                <li className="font-medium">Record your voice directly in the browser</li>
                <li className="font-medium">AI converts your voice into text in any language</li>
                <li className="font-medium">Generate creative ideas based on your words</li>
                <li className="font-medium">Create high-quality images and export PDFs</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Section */}
      {demoActive && (
        <div className="container mx-auto px-6 mb-12 max-w-4xl">
          <Card className="shadow-lg border-2 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-800">Demo Preview</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Transcribed Text:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">{demoText}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Generated Ideas:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">{demoIdeas}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Generated Image:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <img 
                      src={demoImage} 
                      alt="Demo AI Image" 
                      className="rounded-lg shadow-md max-w-full h-auto mx-auto" 
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Exported PDF:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <a
                      href={demoPDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline font-medium inline-flex items-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Download Demo PDF
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  Get Full Access
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <div className="container mx-auto px-6 mb-12 max-w-4xl">
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
            <p className="text-lg mb-8 text-purple-100">
              Start transforming your voice into beautiful creations today. One-time purchase, lifetime access.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg font-semibold"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-8 mt-auto">
        &copy; {new Date().getFullYear()} Creative Soul Studio. All rights reserved.
      </footer>
    </div>
  );
}

