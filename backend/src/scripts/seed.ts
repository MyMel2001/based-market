import bcrypt from 'bcryptjs';
import prisma from '../config/database';

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if we should create sample data
  const createSampleData = process.env.CREATE_SAMPLE_DATA === 'true';

  if (!createSampleData) {
    console.log('✅ Database is ready! No sample data created.');
    console.log('💡 To create sample data for testing, set CREATE_SAMPLE_DATA=true');
    return;
  }

  console.log('📦 Creating sample data for testing...');

  // Create sample users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const devPassword = await bcrypt.hash('dev123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@basedgames.com' },
    update: {},
    create: {
      email: 'admin@basedgames.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const developer1 = await prisma.user.upsert({
    where: { email: 'dev1@example.com' },
    update: {},
    create: {
      email: 'dev1@example.com',
      username: 'indie_dev_1',
      password: devPassword,
      role: 'DEVELOPER',
      moneroAddress: '4AaB...',
    },
  });

  const developer2 = await prisma.user.upsert({
    where: { email: 'dev2@example.com' },
    update: {},
    create: {
      email: 'dev2@example.com',
      username: 'game_studio',
      password: devPassword,
      role: 'DEVELOPER',
      moneroAddress: '4CcD...',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'gamer@example.com' },
    update: {},
    create: {
      email: 'gamer@example.com',
      username: 'casual_gamer',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('👥 Created sample users');

  // Create sample products (games and apps)
  const products = [
    {
      title: 'Epic Space Adventure',
      description: 'An immersive space exploration game with stunning graphics and engaging storyline. Travel through galaxies, discover new planets, and battle alien species in this epic adventure.',
      productUrl: 'https://example.com/epic-space-adventure',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      price: 0.05, // 0.05 XMR
      category: 'Adventure',
      tags: ['space', 'exploration', 'sci-fi', '3d'],
      type: 'GAME',
      developerId: developer1.id,
    },
    {
      title: 'Retro Puzzle Master',
      description: 'Classic puzzle game with modern twists. Challenge your mind with hundreds of levels, each more challenging than the last.',
      productUrl: 'https://example.com/retro-puzzle-master',
      imageUrl: 'https://picsum.photos/400/300?random=2',
      price: 0, // Free game
      category: 'Puzzle',
      tags: ['puzzle', 'retro', 'casual', '2d'],
      type: 'GAME',
      developerId: developer2.id,
    },
    {
      title: 'Cyber Racing 2077',
      description: 'Futuristic racing game set in a cyberpunk world. Race through neon-lit cities with customizable vehicles and intense multiplayer battles.',
      productUrl: 'https://example.com/cyber-racing-2077',
      imageUrl: 'https://picsum.photos/400/300?random=3',
      price: 0.08, // 0.08 XMR
      category: 'Racing',
      tags: ['racing', 'cyberpunk', 'multiplayer', '3d'],
      type: 'GAME',
      developerId: developer1.id,
    },
    {
      title: 'Mystic Forest Quest',
      description: 'Embark on a magical journey through enchanted forests. Solve mysteries, cast spells, and uncover ancient secrets in this fantasy RPG.',
      productUrl: 'https://example.com/mystic-forest-quest',
      imageUrl: 'https://picsum.photos/400/300?random=4',
      price: 0.03, // 0.03 XMR
      category: 'RPG',
      tags: ['fantasy', 'rpg', 'magic', 'adventure'],
      type: 'GAME',
      developerId: developer2.id,
    },
    {
      title: 'Pixel Art Creator',
      description: 'Create stunning pixel art with this intuitive drawing tool. Perfect for game developers and digital artists. Completely free to use!',
      productUrl: 'https://example.com/pixel-art-creator',
      imageUrl: 'https://picsum.photos/400/300?random=5',
      price: 0, // Free tool
      category: 'Creative',
      tags: ['art', 'pixel', 'creative', 'free'],
      type: 'APP',
      developerId: developer1.id,
    },
    {
      title: 'Task Master Pro',
      description: 'Professional task management application with advanced features for teams and individuals. Boost your productivity with intelligent task scheduling and collaboration tools.',
      productUrl: 'https://example.com/task-master-pro',
      imageUrl: 'https://picsum.photos/400/300?random=6',
      price: 0.02, // 0.02 XMR
      category: 'Productivity',
      tags: ['productivity', 'tasks', 'collaboration', 'business'],
      type: 'APP',
      developerId: developer2.id,
    },
    {
      title: 'Music Studio Lite',
      description: 'Lightweight music production software for beginners and professionals. Create, edit, and mix your music with professional-grade tools.',
      productUrl: 'https://example.com/music-studio-lite',
      imageUrl: 'https://picsum.photos/400/300?random=7',
      price: 0.04, // 0.04 XMR
      category: 'Audio',
      tags: ['music', 'audio', 'production', 'creative'],
      type: 'APP',
      developerId: developer1.id,
    },
    {
      title: 'Code Formatter Plus',
      description: 'Advanced code formatting and beautification tool supporting 50+ programming languages. Free and open-source with plugin support.',
      productUrl: 'https://example.com/code-formatter-plus',
      imageUrl: 'https://picsum.photos/400/300?random=8',
      price: 0, // Free app
      category: 'Developer Tools',
      tags: ['code', 'formatting', 'development', 'free'],
      type: 'APP',
      developerId: developer2.id,
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { 
        title: productData.title,
      },
      update: {},
      create: productData,
    });
  }

  console.log('🎮 Created sample products (games and apps)');

  // Create some sample transactions
  const freeProduct = await prisma.product.findFirst({
    where: { price: 0 },
  });

  if (freeProduct) {
    await prisma.transaction.upsert({
      where: {
        id: 'sample-free-transaction',
      },
      update: {},
      create: {
        id: 'sample-free-transaction',
        productId: freeProduct.id,
        buyerId: user1.id,
        sellerId: freeProduct.developerId,
        amount: 0,
        status: 'COMPLETED',
      },
    });

    // Update download count
    await prisma.product.update({
      where: { id: freeProduct.id },
      data: {
        downloadCount: 1,
      },
    });
  }

  console.log('💰 Created sample transactions');
  console.log('✅ Sample data created successfully!');
  
  console.log('\n📋 Sample credentials:');
  console.log('Admin: admin@basedgames.com / admin123');
  console.log('Developer 1: dev1@example.com / dev123');
  console.log('Developer 2: dev2@example.com / dev123');
  console.log('User: gamer@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 