"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.8, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <Loader2 className="h-12 w-12 animate-spin text-red-800" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-medium text-red-800"
            >
                Loading...
            </motion.p>
        </div>
    );
};

export default Loading;
