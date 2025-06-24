"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Calendar, Percent, Home } from "lucide-react";

interface EMICalculatorProps {
  price: number;
}

interface EMIBreakdown {
  emi: number;
  totalInterest: number;
  totalAmount: number;
  principalPercentage: number;
  interestPercentage: number;
}

const EMICalculator: React.FC<EMICalculatorProps> = ({ price }) => {
  const [propertyPrice, setPropertyPrice] = useState(price);
  const [downPayment, setDownPayment] = useState(price * 0.2);
  const [loanAmount, setLoanAmount] = useState(price * 0.8);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [emiBreakdown, setEmiBreakdown] = useState<EMIBreakdown>({
    emi: 0,
    totalInterest: 0,
    totalAmount: 0,
    principalPercentage: 0,
    interestPercentage: 0,
  });

  const calculateEMI = () => {
    const principal = loanAmount;
    const monthlyRate = interestRate / (12 * 100);
    const months = tenure * 12;

    if (monthlyRate === 0) {
      const emi = principal / months;
      setEmiBreakdown({
        emi,
        totalInterest: 0,
        totalAmount: principal,
        principalPercentage: 100,
        interestPercentage: 0,
      });
      return;
    }

    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalAmount = emi * months;
    const totalInterest = totalAmount - principal;
    const principalPercentage = (principal / totalAmount) * 100;
    const interestPercentage = (totalInterest / totalAmount) * 100;

    setEmiBreakdown({
      emi,
      totalInterest,
      totalAmount,
      principalPercentage,
      interestPercentage,
    });
  };

  useEffect(() => {
    setDownPayment(propertyPrice * 0.2);
  }, [propertyPrice]);

  useEffect(() => {
    setLoanAmount(propertyPrice - downPayment);
  }, [propertyPrice, downPayment]);

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, tenure]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const downPaymentPercentage = (downPayment / propertyPrice) * 100;

  return (
    <div className="max-h-[70vh] overflow-y-auto mt-5">
      <div className="space-y-4 px-2">
        {/* EMI Result - Show first on mobile */}
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Monthly EMI
              </Label>
              <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(emiBreakdown.emi)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Inputs */}
          <div className="space-y-4">
            {/* Property Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base">
                  <Home className="h-4 w-4" />
                  Car Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Car Price */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Car Price ({formatCurrency(propertyPrice)})
                  </Label>
                  <Slider
                    value={[propertyPrice]}
                    onValueChange={(value) => setPropertyPrice(value[0])}
                    max={Math.max(price * 2, 5000000)}
                    min={Math.min(price * 0.5, 500000)}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(Math.min(price * 0.5, 500000))}</span>
                    <span>{formatCurrency(Math.max(price * 2, 5000000))}</span>
                  </div>
                </div>

                {/* Down Payment */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Down Payment ({downPaymentPercentage.toFixed(1)}%)
                  </Label>
                  <Input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="text-sm"
                  />
                  <Slider
                    value={[downPayment]}
                    onValueChange={(value) => setDownPayment(value[0])}
                    max={propertyPrice * 0.5}
                    min={propertyPrice * 0.1}
                    step={propertyPrice * 0.01}
                    className="w-full"
                  />
                </div>

                {/* Loan Amount Display */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Loan Amount</Label>
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(loanAmount)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base">
                  <DollarSign className="h-4 w-4" />
                  Loan Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-3 w-3" />
                    Interest Rate ({interestRate}% p.a.)
                  </Label>
                  <Slider
                    value={[interestRate]}
                    onValueChange={(value) => setInterestRate(value[0])}
                    max={15}
                    min={6}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6%</span>
                    <span>15%</span>
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Loan Tenure ({tenure} years)
                  </Label>
                  <Slider
                    value={[tenure]}
                    onValueChange={(value) => setTenure(value[0])}
                    max={30}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 years</span>
                    <span>30 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {/* Payment Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-red-600 dark:text-red-400 text-base">
                  Payment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Principal</span>
                    <span className="font-semibold">
                      {formatCurrency(loanAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span>Total Interest</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(emiBreakdown.totalInterest)}
                    </span>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Total Amount</span>
                      <span className="font-bold">
                        {formatCurrency(emiBreakdown.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>
                      Principal ({emiBreakdown.principalPercentage.toFixed(1)}%)
                    </span>
                    <span>
                      Interest ({emiBreakdown.interestPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${emiBreakdown.principalPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">
                    Down Payment
                  </div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">
                    {downPaymentPercentage.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">
                    Loan to Value
                  </div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">
                    {((loanAmount / propertyPrice) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;
