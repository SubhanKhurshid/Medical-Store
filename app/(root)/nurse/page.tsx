'use client'
import { useAuth } from '@/app/providers/AuthProvider';
import React from 'react';
import { motion } from 'framer-motion';
import Unauthorized from '../unauthorized/page';
import { Button } from '@/components/ui/button';
import { Stethoscope, Clock, Calendar } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.3,
    }
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    }
  }
};

const NursePage = () => {
  const { user } = useAuth();
  console.log(user)
  
  if (user?.role !== "nurse") {
    return <Unauthorized />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          variants={itemVariants}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-700 mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome, Nurse {user.name}!
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl text-emerald-600 mb-8"
          >
            Hope you have a great day!
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Stethoscope className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-emerald-700 mb-2">Patient Care</h2>
            <p className="text-emerald-600">Provide exceptional care to your patients</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Clock className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-emerald-700 mb-2">Shift Management</h2>
            <p className="text-emerald-600">Manage your shifts efficiently</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Calendar className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-emerald-700 mb-2">Schedule</h2>
            <p className="text-emerald-600">View and manage your work schedule</p>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="text-center"
        >
          <Button
            onClick={() => console.log('Shift started!')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Start Shift
          </Button>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-emerald-600 italic">
            "Taking care of patients one shift at a time 💪"
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default NursePage;