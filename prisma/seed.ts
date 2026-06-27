import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Follow, User } from '../src/generated/prisma/client';
import fs from 'fs';
import csv from 'csv-parser'
import crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import path from 'path';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// Generate users
async function generateUsers(count: number) {

    
  const lpath = path.resolve('./data/users_followd.csv')
  const stream = fs.createWriteStream(lpath);
    
    for (let i = 1; i < count; i++) {
        stream.write(
          `user_${i + 100_000},user${i + 100_000},User ${i + 100_000}\n`)
    }

    stream.end();
}

// CELEB FOLLOWERS
async function generateCeleb(row: string[]) {


  const celebrityId = 'user_2';

  console.log(`${JSON.stringify(row)}`)

  const stream = fs.createWriteStream('celeb_followers.csv');
    
  stream.write(`${uuidv7()},${row[0]},${celebrityId}\n`)
   
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
  
  // await generateUsers(2000);

  //const users : {id:string, username: string, displayName:string }[] = [];

  //const lpath = path.resolve('data/users_followd.csv')
  //
  const stream = fs.createWriteStream('celeb_followers.csv');


  fs.createReadStream('users_followd.csv', {encoding: 'utf-8'})
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
            
               const celebrityId = 'user_2';

                console.log(`${JSON.stringify(row)}`)

                                
                stream.write(`${uuidv7()},${row[0]},${celebrityId}\n`)
                 
        }
        
            
        )
        .on('end', () => stream.end()) 

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
