import React, { useState } from "react";
import { useGetFormats } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Download, 
  Terminal, 
  AlertCircle, 
  FileVideo, 
  Music, 
  FileDigit,
  Clock,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "Unknown length";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");

  const { data: formatsResult, isFetching, isError, error } = useGetFormats(
    { url: submittedUrl },
    { 
      query: { 
        enabled: !!submittedUrl, 
        retry: false,
        refetchOnWindowFocus: false
      } 
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setSubmittedUrl(urlInput.trim());
    }
  };

  const handleDownload = (formatId: string) => {
    const downloadUrl = `/api/download?url=${encodeURIComponent(submittedUrl)}&formatId=${encodeURIComponent(formatId)}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center pt-24 px-4 sm:px-6 lg:px-8 pb-24 relative overflow-hidden bg-background">
      {/* Background ambient light */}
      <div className="pointer-events-none fixed top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col gap-12">
        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="flex items-center gap-3 text-primary mb-2">
            <Terminal className="w-8 h-8" />
            <span className="font-mono text-2xl font-bold tracking-tight">VideoGrab</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Extract anything.
          </h1>
          <p className="text-muted-foreground text-lg max-w-[480px]">
            Paste a link from YouTube, TikTok, Instagram, Twitter, and more. We'll handle the rest.
          </p>
        </motion.div>

        {/* Input section */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="relative w-full group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <div className="relative flex items-center bg-card border border-border focus-within:border-primary/50 rounded-lg p-2 shadow-lg transition-colors">
            <Input 
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="border-0 bg-transparent text-lg h-14 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 font-mono placeholder:text-muted-foreground/50 placeholder:font-sans"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isFetching}
            />
            <Button 
              type="submit" 
              size="lg" 
              disabled={!urlInput.trim() || isFetching}
              className="h-12 px-6 font-bold text-base gap-2 group/btn relative overflow-hidden"
            >
              {isFetching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Get Formats</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </motion.form>

        {/* Results section */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {isError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Extraction failed</span>
                    <span className="text-destructive/80 text-sm mt-1">
                      {error?.error || "Could not extract video info. Check your URL and try again."}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {isFetching && !formatsResult && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
                </div>
                <span className="text-muted-foreground font-mono text-sm animate-pulse">Analyzing media source...</span>
              </motion.div>
            )}

            {formatsResult && !isFetching && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="flex flex-col gap-8"
              >
                {/* Media Info */}
                <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl bg-card border border-border shadow-sm">
                  {formatsResult.thumbnail ? (
                    <div className="w-full sm:w-48 aspect-video rounded-md overflow-hidden bg-muted shrink-0 relative group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                      <img 
                        src={formatsResult.thumbnail} 
                        alt={formatsResult.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-48 aspect-video rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
                      <FileVideo className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <h2 className="text-xl font-bold line-clamp-2 text-card-foreground mb-2" title={formatsResult.title}>
                      {formatsResult.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-background w-fit px-3 py-1.5 rounded-md border border-border/50">
                      <Clock className="w-4 h-4 text-primary" />
                      {formatDuration(formatsResult.duration)}
                    </div>
                  </div>
                </div>

                {/* Formats Grid */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="font-semibold text-lg">Available Formats</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {formatsResult.formats.map((format, i) => (
                      <motion.div
                        key={format.formatId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 transition-all gap-4"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className={`p-2 rounded-md flex-shrink-0 ${
                            format.type === 'audio' 
                              ? 'bg-blue-500/10 text-blue-500' 
                              : format.type === 'combined'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            {format.type === 'audio' ? <Music className="w-5 h-5" /> : 
                             format.type === 'combined' ? <FileVideo className="w-5 h-5" /> :
                             <FileDigit className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{format.label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${
                                format.type === 'audio' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : format.type === 'combined'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {format.type}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {format.size !== "Unknown" ? format.size : formatBytes(format.sizeBytes)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleDownload(format.formatId)}
                          variant="secondary"
                          className="w-full sm:w-auto shrink-0 gap-2 bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary/50"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
