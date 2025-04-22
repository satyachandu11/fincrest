"use client";

import React from "react";
import { BarLoader } from "react-spinners";

const LoadingFallback = () => {
  return <BarLoader className="mt-4" width={"100%"} color="#9333ea" />;
};

export default LoadingFallback;