import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Follow, User } from '../src/generated/prisma/client';
import fs from 'fs';
import csv from 'csv-parser'
import crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';


const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// Generate users
async function generateUsers(count: number) {

    const stream = fs.createWriteStream(
        './users.csv');
    
    // stream.write(`id,username,displayName\n`)

    for (let i = 1; i < 100_000; i++) {
        stream.write(
          `user_${i + 1},user${i + 1},User ${i + 1}\n`)
    }

    stream.end();
}


// Generate relationships
async function generateRelationships<T extends {id: string}>(users: T[]) {
  const relationships: Pick<Follow, "followerId" | "createdAt" | "followingId">[] = [];

  const celebrityId = users[0].id;

  const stream = fs.createWriteStream('./relationships.csv');

  // Celebrity: 50k followers
  for (let i = 1; i <= 50_000; i++) {
    stream.write(`${uuidv7()}, ${users[i].id},${celebrityId}\n`)
  }

// Influencers: 10 users with 10k followers each
  for (let influencer = 1;  influencer <= 10; influencer++) {

        const followingId = users[influencer].id;

        for (let i = 1000; i < 11000; i++) {
            if (users[i].id === followingId) continue;

              stream.write(`${uuidv7()},${users[i].id},${followingId}\n`)

        }
  }

  // Regular users
  for (const user of users) {
    const followingCount = Math.floor(Math.random() * 50) + 10;

    const followed: Set<string> = new Set();

    while(followed.size < followingCount) {
          const candidate =
             users[Math.floor(Math.random() * users.length)];

          if (candidate.id === user.id) continue;

          followed.add(candidate.id);
    }

    for (const followingId of followed) {
  
         stream.write(`${uuidv7()},${user.id},${followingId}\n`)

    }
  }
      stream.end();
}

async function main() {
  
  // await generateUsers(100000);

  const users : {id:string, username: string, displayName:string }[] = [];

  fs.createReadStream('./data/users.csv', {encoding: 'utf-8'})
        .pipe(csv({ headers: false }))
        .on('data', (data) => { 
              users.push({ id: data[0], 
                         username: data[1], 
                         displayName: data[2] })
        })
        .on('end', () => generateRelationships(users))

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
