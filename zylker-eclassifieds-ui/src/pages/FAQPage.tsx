import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const faqs = [
  {
    id: 1,
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers.",
  },
  {
    id: 2,
    question: "How long does shipping take?",
    answer:
      "Shipping typically takes 3-5 business days for domestic orders and 7-14 days for international orders.",
  },
  {
    id: 3,
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy for all unused items in their original packaging.",
  },
  {
    id: 4,
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.",
  },
];

const FAQPage = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <button
              className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50"
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            >
              <span className="font-medium">{faq.question}</span>
              {openId === faq.id ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {openId === faq.id && (
              <div className="p-4 bg-gray-50 border-t">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
