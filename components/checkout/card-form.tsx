"use client";

import { useState, ChangeEvent } from "react";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";

export type CardData = {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
};

type CardFormProps = {
  onChange: (cardData: CardData) => void;
  disabled?: boolean;
};

export function CardForm({ onChange, disabled }: CardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "").slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
    updateForm(formatted, cardholderName, expirationMonth, expirationYear, securityCode);
  };

  const handleCardholderNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 50);
    setCardholderName(value);
    updateForm(cardNumber, value, expirationMonth, expirationYear, securityCode);
  };

  const handleExpirationMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 2);
    if (value === "" || (Number(value) >= 1 && Number(value) <= 12)) {
      setExpirationMonth(value);
      updateForm(cardNumber, cardholderName, value, expirationYear, securityCode);
    }
  };

  const handleExpirationYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 2);
    setExpirationYear(value);
    updateForm(cardNumber, cardholderName, expirationMonth, value, securityCode);
  };

  const handleSecurityCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setSecurityCode(value);
    updateForm(cardNumber, cardholderName, expirationMonth, expirationYear, value);
  };

  const updateForm = (
    number: string,
    name: string,
    month: string,
    year: string,
    cvv: string
  ) => {
    onChange({
      cardNumber: number.replace(/\s/g, ""),
      cardholderName: name,
      expirationMonth: month,
      expirationYear: year,
      securityCode: cvv
    });
  };

  const isCardNumberValid = cardNumber.replace(/\s/g, "").length === 16;
  const isExpirationValid =
    expirationMonth.length === 2 && expirationYear.length === 2;
  const isSecurityCodeValid = securityCode.length >= 3;
  const isCardholderNameValid = cardholderName.trim().length >= 3;

  return (
    <section className="rounded-xl border border-white/[0.12] bg-[#080d17]/95 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-white/[0.72]">
        <CreditCard className="size-4 text-rio-cyan" />
        Datos de la tarjeta
      </div>

      <div className="mt-4 grid gap-3">
        <Input
          required
          disabled={disabled}
          aria-label="Número de tarjeta"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={handleCardNumberChange}
          maxLength={19}
          className={!isCardNumberValid && cardNumber ? "border-red-400/50" : ""}
        />

        <Input
          required
          disabled={disabled}
          aria-label="Nombre del titular"
          placeholder="Nombre Completo"
          value={cardholderName}
          onChange={handleCardholderNameChange}
          className={!isCardholderNameValid && cardholderName ? "border-red-400/50" : ""}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            required
            disabled={disabled}
            aria-label="Mes de vencimiento"
            placeholder="MM"
            value={expirationMonth}
            onChange={handleExpirationMonthChange}
            maxLength={2}
            className={!isExpirationValid && expirationMonth ? "border-red-400/50" : ""}
          />
          <Input
            required
            disabled={disabled}
            aria-label="Año de vencimiento"
            placeholder="YY"
            value={expirationYear}
            onChange={handleExpirationYearChange}
            maxLength={2}
            className={!isExpirationValid && expirationYear ? "border-red-400/50" : ""}
          />
          <Input
            required
            disabled={disabled}
            aria-label="Código de seguridad"
            placeholder="CVV"
            value={securityCode}
            onChange={handleSecurityCodeChange}
            maxLength={4}
            type="password"
            className={!isSecurityCodeValid && securityCode ? "border-red-400/50" : ""}
          />
        </div>

        <p className="text-xs text-white/[0.48]">
          Tu información de tarjeta es procesada de forma segura por Mercado Pago.
        </p>
      </div>
    </section>
  );
}
