import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { users, stats,followers,
  posts, media, postMedia } from './users'

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {

  /*await prisma.user.createMany({
      data: users,
      skipDuplicates: true
  })

  await prisma.post.createMany({
      data: posts,
      skipDuplicates: true
  }) 
  
  await prisma.media.createMany({
      data: media,
      skipDuplicates: true
  })

  await prisma.postMedia.createMany({
      data: postMedia,
      skipDuplicates: true
  })

  for(let i = 0; i <= stats.length; i++) {

    await prisma.postStats.update({
        where: { postId: stats[i].postId },
        data: {
          likesCount: stats[i].likesCount,
          commentsCount: stats[i].commentsCount,
          repostsCount: stats[i].repostsCount,
          viewsCount: stats[i].viewsCount
        },
    })

  };  */

 await prisma.follow.createMany({
      data: followers,
      skipDuplicates: true
  })




}

main()
  .then(async () => {
      await prisma.$disconnect();
      await pool.end();
  })
  .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();

      process.exit(1);
  })
