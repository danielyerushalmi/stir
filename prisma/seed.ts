import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkId: 'demo_clerk_id' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id',
      email: 'demo@stirapp.io',
    },
  })

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'demo_restaurant_id' },
    update: {},
    create: {
      id: 'demo_restaurant_id',
      userId: user.id,
      name: 'The Corner Table',
      cuisineType: 'Italian',
      city: 'Austin, TX',
      vibe: "We're a neighbourhood spot — warm, casual, regulars know us by name. We keep it simple: honest food, good wine, and people who actually care.",
    },
  })

  // Voice samples
  const voiceSamples = [
    {
      reviewType: 'positive_5star',
      sampleReview: 'Absolutely incredible. The pasta was handmade and the service was attentive without being overbearing. Will be back every week.',
      ownerResponse: "So glad you made it in! Handmade pasta is our whole thing — Marco's been rolling it every morning since day one. See you next week.",
    },
    {
      reviewType: 'wait_complaint',
      sampleReview: 'Waited 45 minutes for our food on a Tuesday night. Not busy at all. Food was good but the wait killed the vibe.',
      ownerResponse: "That's on us — a Tuesday wait like that isn't acceptable and I'm sorry it dragged the evening down. We had a kitchen hiccup that night. Come back and I'll make it right.",
    },
    {
      reviewType: 'food_complaint',
      sampleReview: 'The risotto was undercooked and bland. For the price I expected a lot more.',
      ownerResponse: "Undercooked risotto is not what we send out — or it shouldn't be. That's a miss and I genuinely want to hear more. Email me at hello@thecornertable.com and I'll make sure your next visit is the one it should have been.",
    },
    {
      reviewType: 'mixed',
      sampleReview: 'Great atmosphere and friendly staff. The tiramisu was the best I have had. Main course was a bit salty though.',
      ownerResponse: "Love hearing that the tiramisu landed! The saltiness on the main is useful feedback — passing it straight to the kitchen. Thanks for the honest note and glad the overall evening worked.",
    },
    {
      reviewType: 'price_complaint',
      sampleReview: 'Good food but very overpriced for a casual place. $28 for a pasta dish is too much.',
      ownerResponse: "Fair point — our prices reflect sourcing everything locally and making pasta fresh daily, but I hear you on the value question. We do a weeknight prix-fixe that might hit better. Worth a look.",
    },
  ]

  for (const vs of voiceSamples) {
    await prisma.voiceSample.upsert({
      where: { id: `seed_vs_${vs.reviewType}` },
      update: {},
      create: { id: `seed_vs_${vs.reviewType}`, restaurantId: restaurant.id, ...vs },
    })
  }

  // Platforms
  const platforms = ['GOOGLE', 'YELP', 'TRIPADVISOR']
  for (const name of platforms) {
    await prisma.platform.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name } },
      update: {},
      create: { restaurantId: restaurant.id, name, isConnected: true, externalId: `mock_${name.toLowerCase()}` },
    })
  }

  // Reviews — 45 across Google, Yelp, TripAdvisor + delivery platforms
  const reviewData = [
    { platform: 'GOOGLE', externalId: 'g1', rating: 5, authorName: 'Sarah M.', isDelivery: false, reviewDate: new Date('2026-04-28'), reviewText: 'Best Italian in Austin. The carbonara is life-changing and the staff remembered my name on my second visit.' },
    { platform: 'GOOGLE', externalId: 'g2', rating: 4, authorName: 'James T.', isDelivery: false, reviewDate: new Date('2026-04-25'), reviewText: 'Solid food, great wine list. Can get a bit loud on weekends but the pasta makes up for it.' },
    { platform: 'GOOGLE', externalId: 'g3', rating: 2, authorName: 'Linda R.', isDelivery: false, reviewDate: new Date('2026-04-20'), reviewText: 'Service was painfully slow and my risotto arrived cold. Disappointing for the price.' },
    { platform: 'GOOGLE', externalId: 'g4', rating: 5, authorName: 'Carlos V.', isDelivery: false, reviewDate: new Date('2026-04-18'), reviewText: 'The tiramisu alone is worth the trip. Warm atmosphere, genuine service.' },
    { platform: 'GOOGLE', externalId: 'g5', rating: 3, authorName: 'Amy K.', isDelivery: false, reviewDate: new Date('2026-04-15'), reviewText: 'Food was good but nothing special. Expected more from the hype.' },
    { platform: 'GOOGLE', externalId: 'g6', rating: 5, authorName: 'Ben H.', isDelivery: false, reviewDate: new Date('2026-04-10'), reviewText: 'Date night perfection. Candles, handmade pasta, attentive team. Already booked our next table.' },
    { platform: 'GOOGLE', externalId: 'g7', rating: 1, authorName: 'Megan D.', isDelivery: false, reviewDate: new Date('2026-04-05'), reviewText: 'Hair in my pasta. Manager was dismissive. Never coming back.' },
    { platform: 'GOOGLE', externalId: 'g8', rating: 4, authorName: 'David L.', isDelivery: false, reviewDate: new Date('2026-03-30'), reviewText: 'Love this place. The pappardelle with wild boar is excellent. Minor gripe: reservation system is clunky.' },
    { platform: 'GOOGLE', externalId: 'g9', rating: 5, authorName: 'Priya N.', isDelivery: false, reviewDate: new Date('2026-03-25'), reviewText: 'Authentic flavours and a cosy room. The kind of spot that feels like a local secret.' },
    { platform: 'GOOGLE', externalId: 'g10', rating: 4, authorName: 'Tom W.', isDelivery: false, reviewDate: new Date('2026-03-20'), reviewText: 'Great lunch spot. The lunch special is incredible value. Will be a regular.' },
    { platform: 'GOOGLE', externalId: 'g11', rating: 3, authorName: 'Rachel B.', isDelivery: false, reviewDate: new Date('2026-03-15'), reviewText: 'Decent food but the service felt rushed. Not bad, just not the experience I hoped for.' },
    { platform: 'GOOGLE', externalId: 'g12', rating: 5, authorName: 'Mark S.', isDelivery: false, reviewDate: new Date('2026-03-10'), reviewText: 'Incredible fresh pasta and a warm welcome. This is what dining out should feel like.' },
    { platform: 'GOOGLE', externalId: 'g13', rating: 2, authorName: 'Judy C.', isDelivery: false, reviewDate: new Date('2026-03-05'), reviewText: 'Overpriced for what it is. $28 for a bowl of pasta that tastes like it came from a jar.' },
    { platform: 'GOOGLE', externalId: 'g14', rating: 5, authorName: 'Oliver P.', isDelivery: false, reviewDate: new Date('2026-03-01'), reviewText: 'Simply delicious. Fresh ingredients, generous portions, staff that genuinely care.' },
    { platform: 'GOOGLE', externalId: 'g15', rating: 4, authorName: 'Hannah J.', isDelivery: false, reviewDate: new Date('2026-02-25'), reviewText: 'Lovely evening. The gnocchi was pillowy perfect. Slightly long wait for a table.' },
    { platform: 'YELP', externalId: 'y1', rating: 5, authorName: 'Alex G.', isDelivery: false, reviewDate: new Date('2026-04-27'), reviewText: 'A gem. Every dish tasted lovingly made. The bruschetta to start is a must.' },
    { platform: 'YELP', externalId: 'y2', rating: 4, authorName: 'Natalie F.', isDelivery: false, reviewDate: new Date('2026-04-22'), reviewText: 'Solid neighbourhood Italian. Nice wine list, warm lighting. Noise levels are a bit high.' },
    { platform: 'YELP', externalId: 'y3', rating: 1, authorName: 'Steve A.', isDelivery: false, reviewDate: new Date('2026-04-19'), reviewText: 'Waited 55 minutes for food on a quiet night. Staff seemed overwhelmed. Left without dessert.' },
    { platform: 'YELP', externalId: 'y4', rating: 5, authorName: 'Diana C.', isDelivery: false, reviewDate: new Date('2026-04-14'), reviewText: 'My favourite restaurant in Austin. Come for the pasta, stay for the tiramisu.' },
    { platform: 'YELP', externalId: 'y5', rating: 3, authorName: 'Ryan M.', isDelivery: false, reviewDate: new Date('2026-04-08'), reviewText: 'Good but not great. The amatriciana needed more depth. Service was friendly though.' },
    { platform: 'YELP', externalId: 'y6', rating: 5, authorName: 'Chloe T.', isDelivery: false, reviewDate: new Date('2026-04-02'), reviewText: 'The freshest pasta I have had outside of Italy. Prices are fair for this quality.' },
    { platform: 'YELP', externalId: 'y7', rating: 2, authorName: 'Paul H.', isDelivery: false, reviewDate: new Date('2026-03-28'), reviewText: 'Disappointing. The food was lukewarm and the portions are small for the price.' },
    { platform: 'YELP', externalId: 'y8', rating: 5, authorName: 'Emma R.', isDelivery: false, reviewDate: new Date('2026-03-22'), reviewText: 'Romantic, delicious, and unpretentious. The perfect date night spot.' },
    { platform: 'YELP', externalId: 'y9', rating: 4, authorName: 'Chris K.', isDelivery: false, reviewDate: new Date('2026-03-18'), reviewText: 'Really good pasta. The chicken piccata was a highlight. Will come back.' },
    { platform: 'YELP', externalId: 'y10', rating: 3, authorName: 'Sophie L.', isDelivery: false, reviewDate: new Date('2026-03-12'), reviewText: 'Friendly staff and nice space. Food was fine but I have had better Italian elsewhere.' },
    { platform: 'TRIPADVISOR', externalId: 'ta1', rating: 5, authorName: 'John E.', isDelivery: false, reviewDate: new Date('2026-04-26'), reviewText: 'Hidden gem of Austin. Authentic Italian cooking with real passion behind every plate.' },
    { platform: 'TRIPADVISOR', externalId: 'ta2', rating: 4, authorName: 'Mary B.', isDelivery: false, reviewDate: new Date('2026-04-21'), reviewText: 'Lovely room, great food. A touch pricey but worth it for a special occasion.' },
    { platform: 'TRIPADVISOR', externalId: 'ta3', rating: 2, authorName: 'Kevin D.', isDelivery: false, reviewDate: new Date('2026-04-16'), reviewText: 'Service needs work. The food arrived at different times and the pasta was over-salted.' },
    { platform: 'TRIPADVISOR', externalId: 'ta4', rating: 5, authorName: 'Anna W.', isDelivery: false, reviewDate: new Date('2026-04-11'), reviewText: 'The best meal of our Austin trip. Homemade pasta, excellent wine, wonderful service.' },
    { platform: 'TRIPADVISOR', externalId: 'ta5', rating: 4, authorName: 'Peter S.', isDelivery: false, reviewDate: new Date('2026-04-06'), reviewText: 'Consistently good. Regulars feel that every time we visit. A real neighbourhood cornerstone.' },
    { platform: 'DOORDASH', externalId: 'dd1', rating: 3, authorName: 'User_4521', isDelivery: true, reviewDate: new Date('2026-04-29'), reviewText: 'Pasta was decent but arrived cold and the portion felt smaller than dining in.' },
    { platform: 'DOORDASH', externalId: 'dd2', rating: 2, authorName: 'User_7893', isDelivery: true, reviewDate: new Date('2026-04-23'), reviewText: 'Carbonara was clumped together by the time it arrived. Not the restaurants fault but still disappointing.' },
    { platform: 'DOORDASH', externalId: 'dd3', rating: 4, authorName: 'User_1102', isDelivery: true, reviewDate: new Date('2026-04-17'), reviewText: 'The tiramisu travels well. Everything else was okay. Bread arrived crushed.' },
    { platform: 'UBEREATS', externalId: 'ue1', rating: 2, authorName: 'User_3349', isDelivery: true, reviewDate: new Date('2026-04-24'), reviewText: 'Spaghetti was cold and overcooked. Would not order delivery again.' },
    { platform: 'UBEREATS', externalId: 'ue2', rating: 3, authorName: 'User_6612', isDelivery: true, reviewDate: new Date('2026-04-13'), reviewText: 'Decent for delivery but not the same as eating in. Worth the trip to the restaurant.' },
    { platform: 'UBEREATS', externalId: 'ue3', rating: 4, authorName: 'User_9870', isDelivery: true, reviewDate: new Date('2026-04-03'), reviewText: 'Surprised at how well the bolognese held up. Came reasonably hot and tasted fresh.' },
    { platform: 'GRUBHUB', externalId: 'gh1', rating: 1, authorName: 'User_5544', isDelivery: true, reviewDate: new Date('2026-04-20'), reviewText: 'Order was missing the salad and the pasta was ice cold. Never again.' },
    { platform: 'GRUBHUB', externalId: 'gh2', rating: 3, authorName: 'User_2278', isDelivery: true, reviewDate: new Date('2026-04-09'), reviewText: 'Average delivery experience. Food is clearly better in person.' },
    { platform: 'GRUBHUB', externalId: 'gh3', rating: 2, authorName: 'User_8831', isDelivery: true, reviewDate: new Date('2026-04-01'), reviewText: 'Sauce spilled everywhere in the bag. Packaging needs improvement badly.' },
    { platform: 'TRIPADVISOR', externalId: 'ta6', rating: 3, authorName: 'Claire N.', isDelivery: false, reviewDate: new Date('2026-04-01'), reviewText: 'Enjoyable dinner overall. The pasta was good but service was inattentive toward the end of the evening.' },
  ]

  for (const r of reviewData) {
    await prisma.review.upsert({
      where: { platform_externalId: { platform: r.platform, externalId: r.externalId } },
      update: {},
      create: { restaurantId: restaurant.id, ...r },
    })
  }

  // Subscription
  await prisma.subscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: { restaurantId: restaurant.id, plan: 'FREE', status: 'active' },
  })

  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
