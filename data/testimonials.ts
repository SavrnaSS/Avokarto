import { Testimonial } from "@/types";

import { testimonialsProducts } from "@/data/products/testimonialsProducts";

const getTestimonialProduct = (id: number) => {
  const product = testimonialsProducts.find((item) => item.id === id);

  return product;
};

export const reviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/24",
    rating: 5,
    text: `"Such a relief! This has been a game-changer for improving my concentration and mental clarity."`,
    name: "Sofia Garcia",
    verified: false,

    product: getTestimonialProduct(1000),
  },
  {
    title: "The hype is real!",
    date: "23/01/25",
    rating: 5,
    text: `"Definitely worth it! After using this, I feel more present and focused throughout my day."`,
    name: "David Williams",
    verified: true,

    product: getTestimonialProduct(1001),
  },
  {
    title: "Helped with my brainfog!",
    date: "09/02/25",
    rating: 5,
    text: `"Amazing! This product truly cleared up my brain fog and helped me focus better. Highly recommend!"`,
    name: "Emma Martinez",
    verified: false,

    product: getTestimonialProduct(1002),
  },
];

export const reviews2: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5, // number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Elena Rodriguez",
    verified: false,
    product: getTestimonialProduct(1003),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Williams",
    verified: true,
    product: getTestimonialProduct(1004),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Emma Martinez",
    verified: false,
    product: getTestimonialProduct(1005),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5, // number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Mariana Costa",
    verified: false,
    product: getTestimonialProduct(1006),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Isabelle Dubois",
    verified: true,
    product: getTestimonialProduct(1007),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Alexia Romano",
    verified: false,
    product: getTestimonialProduct(1008),
  },
];

export const productReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Yuki Tanaka",
    verified: false,
    product: getTestimonialProduct(1009),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Priya Sharma",
    verified: true,
    product: getTestimonialProduct(1010),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Helena Nova",
    verified: false,
    product: getTestimonialProduct(1011),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Camille Laurent",
    verified: false,
    product: getTestimonialProduct(1012),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Emma Linden",
    verified: true,
    product: getTestimonialProduct(1013),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Rosalie Moreno",
    verified: false,
    product: getTestimonialProduct(1014),
  },
];

export const reviews3: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Olivia Chen",
    verified: false,
    product: getTestimonialProduct(1015),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Maya Patel",
    verified: true,
    product: getTestimonialProduct(1016),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Victoria Anderson",
    verified: false,
    product: getTestimonialProduct(1017),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Amelia Thompson",
    verified: false,
    product: getTestimonialProduct(1018),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Isabella White",
    verified: true,
    product: getTestimonialProduct(1019),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5, // Number of filled stars
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Grace Murphy",
    verified: false,
    product: getTestimonialProduct(1020),
  },
];

export const reviews4: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Sophia Meier",
    verified: false,

    product: getTestimonialProduct(1021),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Nicole King",
    verified: true,

    product: getTestimonialProduct(1022),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Hannah Schmidt",
    verified: false,

    product: getTestimonialProduct(1023),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Zara Klein",
    verified: false,

    product: getTestimonialProduct(1024),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Fiona O'Neill",
    verified: true,

    product: getTestimonialProduct(1025),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Lena Fischer",
    verified: false,

    product: getTestimonialProduct(1026),
  },
];

export const simpleReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1027),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Sasha Petro",
    verified: true,

    product: getTestimonialProduct(1028),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Rachel Stevens",
    verified: false,

    product: getTestimonialProduct(1029),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Clara Jensen",
    verified: false,

    product: getTestimonialProduct(1030),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Marta Holer",
    verified: true,

    product: getTestimonialProduct(1031),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Lucia Rosier",
    verified: false,

    product: getTestimonialProduct(1032),
  },
];

export const electronicsReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1033),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Marina",
    verified: true,

    product: getTestimonialProduct(1034),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Diana",
    verified: false,

    product: getTestimonialProduct(1035),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Bianca",
    verified: false,

    product: getTestimonialProduct(1036),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1037),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Francesca Mancini",
    verified: false,

    product: getTestimonialProduct(1038),
  },
];

export const smallProductReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Carlotta Bianca",
    verified: false,

    product: getTestimonialProduct(1039),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Tatiana Sokoto",
    verified: true,

    product: getTestimonialProduct(1040),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Sylvia Berger",
    verified: false,

    product: getTestimonialProduct(1041),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1042),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1043),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Steve Smith",
    verified: false,

    product: getTestimonialProduct(1044),
  },
];

export const electroProductReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1045),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Steve Smith",
    verified: true,

    product: getTestimonialProduct(1046),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1047),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Peter Johnson",
    verified: false,

    product: getTestimonialProduct(1048),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Emily Davis",
    verified: true,

    product: getTestimonialProduct(1049),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1050),
  },
];

export const babyShopReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,

    product: getTestimonialProduct(1051),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Peter Parker",
    verified: true,

    product: getTestimonialProduct(1052),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Josef Smith",
    verified: false,

    product: getTestimonialProduct(1053),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1054),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: true,

    product: getTestimonialProduct(1055),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Andrew Tye",
    verified: false,

    product: getTestimonialProduct(1056),
  },
];

export const simpleTextReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Andrew Tye",
    verified: false,
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: true,
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Warner",
    verified: false,
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Steve Smith",
    verified: false,
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Andrew Tye",
    verified: true,
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "David Williams",
    verified: false,
  },
];

export const animalAccessoriesReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Peterson",
    verified: false,

    product: getTestimonialProduct(1057),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Johnson",
    verified: true,

    product: getTestimonialProduct(1058),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Natalia Jimenez",
    verified: false,

    product: getTestimonialProduct(1059),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Camilla Knudsen",
    verified: false,

    product: getTestimonialProduct(1060),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Leila Larson",
    verified: true,

    product: getTestimonialProduct(1061),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Marina Martinez",
    verified: false,

    product: getTestimonialProduct(1062),
  },
];

export const animalAccessoriesSetReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Nora Nova",
    verified: false,

    product: getTestimonialProduct(1063),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Olivia Olson",
    verified: true,

    product: getTestimonialProduct(1064),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Petra Petersen",
    verified: false,

    product: getTestimonialProduct(1065),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Quine Quinn",
    verified: false,

    product: getTestimonialProduct(1066),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Ramona Roshi",
    verified: true,

    product: getTestimonialProduct(1067),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Sofia Schmidt",
    verified: false,

    product: getTestimonialProduct(1068),
  },
];

export const ceramicsAccessoriesReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Tatiana Thorn",
    verified: false,

    product: getTestimonialProduct(1069),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Ursula Uhl",
    verified: true,

    product: getTestimonialProduct(1070),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Andrew Tye",
    verified: false,

    product: getTestimonialProduct(1071),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Wendy Wilson",
    verified: false,

    product: getTestimonialProduct(1072),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Xenia Xavier",
    verified: true,

    product: getTestimonialProduct(1073),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Yassir Young",
    verified: false,

    product: getTestimonialProduct(1074),
  },
];

export const smartDevicesReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Zara Zimmerman",
    verified: false,

    product: getTestimonialProduct(1075),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Alicia Adams",
    verified: true,

    product: getTestimonialProduct(1076),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Brianna Brooks",
    verified: false,

    product: getTestimonialProduct(1077),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Catherine Clark",
    verified: false,

    product: getTestimonialProduct(1078),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Diana Davis",
    verified: true,

    product: getTestimonialProduct(1079),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Emily Evans",
    verified: false,

    product: getTestimonialProduct(1080),
  },
];

export const basketballReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Fiona Fisher",
    verified: false,

    product: getTestimonialProduct(1081),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Grace Green",
    verified: true,

    product: getTestimonialProduct(1082),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Hannah Harris",
    verified: false,

    product: getTestimonialProduct(1083),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Iris Johnson",
    verified: false,

    product: getTestimonialProduct(1084),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Jessica Jones",
    verified: true,

    product: getTestimonialProduct(1085),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Karen Knight",
    verified: false,

    product: getTestimonialProduct(1086),
  },
];

export const skateReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Lillian Lee",
    verified: false,
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Monica Moore",
    verified: true,
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Nicole Nelson",
    verified: false,
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Olivia Owen",
    verified: false,
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Penny Parker",
    verified: true,
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Queen Quinn",
    verified: false,
  },
];

export const teaReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Rachel Reed",
    verified: false,

    product: getTestimonialProduct(1087),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Sophia Scott",
    verified: true,

    product: getTestimonialProduct(1088),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Tina Taylor",
    verified: false,

    product: getTestimonialProduct(1089),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Una Underwood",
    verified: false,

    product: getTestimonialProduct(1090),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Victoria Vale",
    verified: true,

    product: getTestimonialProduct(1091),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: "I've always tried to choose only the best quality clothes. I have never been disappointed here.",
    reviewer: "Wendy Waters",
    verified: false,

    product: getTestimonialProduct(1092),
  },
];

export const chocolateReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Xenia Xerxes",
    verified: false,

    product: getTestimonialProduct(1093),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    reviewer: "Jasmine Yates",
    verified: true,

    product: getTestimonialProduct(1094),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Zoe Feller",
    verified: false,

    product: getTestimonialProduct(1095),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Adrienne Adams",
    verified: false,

    product: getTestimonialProduct(1096),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    reviewer: "Bella Brown",
    verified: true,

    product: getTestimonialProduct(1097),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Cassidy Clark",
    verified: false,

    product: getTestimonialProduct(1098),
  },
];

export const reviewCards: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Danielle Davis",
    verified: false,

    product: getTestimonialProduct(1099),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    reviewer: "Evelyn Evans",
    verified: true,

    product: getTestimonialProduct(1100),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Felicity Ford",
    verified: false,

    product: getTestimonialProduct(1101),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Emily Grant",
    verified: false,

    product: getTestimonialProduct(1102),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    reviewer: "Harper Hall",
    verified: true,

    product: getTestimonialProduct(1103),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    reviewer: "Ivy Irving",
    verified: false,

    product: getTestimonialProduct(1104),
  },
];

export const campingReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Juliana James",
    verified: false,
    product: getTestimonialProduct(1105),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Kristina King",
    verified: true,
    product: getTestimonialProduct(1106),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Luna Lewis",
    verified: false,
    product: getTestimonialProduct(1107),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Molly Mitchell",
    verified: false,
    product: getTestimonialProduct(1108),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Natalie Nathan",
    verified: true,
    product: getTestimonialProduct(1109),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    fullStarCount: 3,
    reviewText: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Ophelia Osborn",
    verified: false,
    product: getTestimonialProduct(1110),
  },
];

export const babyReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Paisley Palmer",

    verified: false,
    product: getTestimonialProduct(1111),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Quinn Quinn",

    verified: true,
    product: getTestimonialProduct(1112),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Riley Reed",

    verified: false,
    product: getTestimonialProduct(1113),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Sienna Scott",

    verified: false,
    product: getTestimonialProduct(1114),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Tala Taylor",

    verified: true,
    product: getTestimonialProduct(1115),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Uriel Upton",

    verified: false,
    product: getTestimonialProduct(1116),
  },
];

export const hoodieReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Vanessa Vale",
    verified: false,

    product: getTestimonialProduct(1117),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Minoan Webb",
    verified: true,

    product: getTestimonialProduct(1118),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Hyla Xavier",
    verified: false,

    product: getTestimonialProduct(1119),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Jasmine York",
    verified: false,

    product: getTestimonialProduct(1120),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Zelda Zimmerman",
    verified: true,

    product: getTestimonialProduct(1121),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Aurora Archer",
    verified: false,

    product: getTestimonialProduct(1122),
  },
];

// borkhaReviews.js
export const borkhaReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Bella Banks",
    verified: false,

    product: getTestimonialProduct(1123),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Clara Carter",
    verified: true,

    product: getTestimonialProduct(1124),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1125),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Elena Edwards",
    verified: false,

    product: getTestimonialProduct(1126),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Francesca Frazier",
    verified: true,

    product: getTestimonialProduct(1127),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Gemma Gates",
    verified: false,

    product: getTestimonialProduct(1128),
  },
];

export const babyReviews2: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Haley Harris",
    verified: false,

    product: getTestimonialProduct(1129),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Iris Ireland",
    verified: true,

    product: getTestimonialProduct(1130),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Joanna Jackson",
    verified: false,

    product: getTestimonialProduct(1131),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Kimberly Knight",
    verified: false,

    product: getTestimonialProduct(1132),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Lena Lambert",
    verified: true,

    product: getTestimonialProduct(1133),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Margot Martin",
    verified: false,

    product: getTestimonialProduct(1134),
  },
];

export const hatReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Natalie Norton",
    verified: false,

    product: getTestimonialProduct(1135),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Olivia Owens",
    verified: true,

    product: getTestimonialProduct(1136),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Peter Parker",
    verified: false,

    product: getTestimonialProduct(1137),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "Quinn Quincy",
    verified: false,

    product: getTestimonialProduct(1138),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1139),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1140),
  },
];

export const shoeReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1141),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1142),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1143),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1144),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1145),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1146),
  },
];

export const beardOilReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1147),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1148),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1149),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1150),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1151),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1152),
  },
];

export const campingReviews2: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1153),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1154),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1155),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1156),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1157),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1158),
  },
];

export const carReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1159),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1160),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1161),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1162),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1163),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1164),
  },
];

export const beddingReviews: Testimonial[] = [
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1165),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1166),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1167),
  },
  {
    title: "Absolutely fantastic product!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1168),
  },
  {
    title: "The hype is real!",
    date: "23/05/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: true,

    product: getTestimonialProduct(1169),
  },
  {
    title: "Helped with my brainfog!",
    date: "04/12/25",
    rating: 5,
    text: `"I've always tried to choose only the best quality clothes. I have never been disappointed here."`,
    reviewer: "David Warner",
    verified: false,

    product: getTestimonialProduct(1170),
  },
];

export const videoReviewCards: Testimonial[] = [
  {
    title: "Samsung Galaxy Buds 2 Pro Wireless Earbuds",
    thumbnail:
      "/assets/images/product-single/video-rev-img/video-review-img-02.webp",
    reviewerImage:
      "/assets/images/product-single/video-rev-img/reviewer-img-01.webp",
    videoSrc: "/assets/videos/video-review-1.mp4",
    reviewer: "CEONTHEMAKING",
    date: "March 6, 2018",
  },
  {
    title: "Apple AirPods (3rd Generation) with MagSafe",
    thumbnail:
      "/assets/images/product-single/video-rev-img/video-review-img-02.webp",
    reviewerImage:
      "/assets/images/product-single/video-rev-img/reviewer-img-01.webp",
    videoSrc: "/assets/videos/video-review-1.mp4",
    reviewer: "CEONTHEMAKING",
    date: "March 6, 2018",
  },
  {
    title: "Sony WF-1000XM5 Noise-Canceling Earbuds",
    thumbnail:
      "/assets/images/product-single/video-rev-img/video-review-img-03.webp",
    reviewerImage:
      "/assets/images/product-single/video-rev-img/reviewer-img-01.webp",
    videoSrc: "/assets/videos/video-review-1.mp4",
    reviewer: "CEONTHEMAKING",
    date: "March 6, 2018",
  },
  {
    title: "JBL Live Pro 2 VS Live Free 2 VS Reflect Aero",
    thumbnail:
      "/assets/images/product-single/video-rev-img/video-review-img-04.webp",
    reviewerImage:
      "/assets/images/product-single/video-rev-img/reviewer-img-01.webp",
    videoSrc: "/assets/videos/video-review-1.mp4",
    reviewer: "CEONTHEMAKING",
    date: "March 6, 2018",
  },
];
