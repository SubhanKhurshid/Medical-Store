"use client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full space-y-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            >
                <div className="relative">
                    <Loader2 className="h-12 w-12 text-red-800 animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-red-800/20 rounded-full animate-pulse" />
                </div>
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-medium text-red-800"
            >
                Loading details...
            </motion.p>
        </div>
    );
};

export default Loading;
