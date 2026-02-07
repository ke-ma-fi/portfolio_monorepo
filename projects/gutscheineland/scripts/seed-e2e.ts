import 'dotenv/config'
import { createTestCard } from '../src/tests/helpers/seed'
import fs from 'fs'
import path from 'path'

async function run() {
  console.log('Seeding E2E Data...')
  try {
    const { card } = await createTestCard()
    
    const data = {
      uuid: card.uuid,
      code: card.code,
    }
    
    fs.writeFileSync(
      path.resolve(process.cwd(), 'e2e-data.json'), 
      JSON.stringify(data, null, 2)
    )
    
    console.log(`Seeded Card UUID: ${card.uuid}`)
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

run()
