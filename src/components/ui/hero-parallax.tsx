"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";



export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-auto min-h-[70vh] md:h-[300vh] py-6 sm:py-10 md:py-40 overflow-hidden antialiased relative flex flex-col self-auto md:[perspective:1000px] md:[transform-style:preserve-3d]"
    >
      <Header />
      {/* Hide parallax images on mobile, show only on md+ */}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="hidden md:block"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row  mb-20 space-x-20 ">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-8 sm:py-12 md:py-40 px-4 w-full left-0 top-0">
      <h1 className="text-2xl sm:text-3xl md:text-7xl font-bold text-black dark:text-white">
        Transform Your Study Materials into{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          Intelligent Mock Tests
        </span>
      </h1>
      <p className="max-w-2xl text-sm sm:text-base md:text-xl mt-4 sm:mt-6 md:mt-8 text-neutral-600 dark:text-neutral-300">
        Upload your notes, PDFs, or images and let our AI generate personalized mock exams.
        Get instant feedback, detailed analytics, and accelerate your exam preparation with MockifyAI.
      </p>
      
      {/* Mobile CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 md:hidden">
        <a 
          href="/signup" 
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          Get Started Free
        </a>
        <a 
          href="#features" 
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-black bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          Explore Features
        </a>
      </div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative shrink-0"
    >
      <div className="block group-hover/product:shadow-2xl pointer-events-none">
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </div>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
        {product.title}
      </h2>
    </motion.div>
  );
};
