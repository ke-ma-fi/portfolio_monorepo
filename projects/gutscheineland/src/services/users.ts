import { PayloadRequest } from 'payload'
import { UsersSlug } from '@/slugs'

interface SyncUserOptions {
  req: PayloadRequest
  stripeAccountId: string
  data: {
    chargesEnabled?: boolean
    payoutsEnabled?: boolean
    detailsSubmitted?: boolean
    onboardingComplete?: boolean
  }
}

export async function syncUserWithCompany({ req, stripeAccountId, data }: SyncUserOptions) {
  const { payload } = req
  
  const userResult = await payload.find({
    req,
    collection: UsersSlug,
    overrideAccess: true,
    where: {
      connectedAccountId: {
        equals: stripeAccountId,
      },
    },
    limit: 1,
  })

  if (userResult.docs.length === 0) {
    console.warn(`No user found with stripeAccountId: ${stripeAccountId}`)
    return
  }

  const user = userResult.docs[0]! //Safe bang because check above

  await payload.update({
    req,
    collection: UsersSlug,
    id: user.id,
    overrideAccess: true,
    data: {
      connectedAccountId: stripeAccountId,
      chargesEnabled: data.chargesEnabled,
      payoutsEnabled: data.payoutsEnabled,
      detailsSubmitted: data.detailsSubmitted,
      onboardingComplete: data.onboardingComplete,
    },
  })
}

interface FirstUserCheckOptions {
  req: PayloadRequest
}

export async function shouldFirstUserBeAdmin({ req }: FirstUserCheckOptions): Promise<boolean> {
  const { totalDocs } = await req.payload.find({
      req,
      collection: UsersSlug,
      limit: 1,
      depth: 0,
  })
  return totalDocs === 0
}

interface GetPublicProfilesOptions {
  req: PayloadRequest
  ids: (string | number)[]
}

export async function getPublicUserProfiles({ req, ids }: GetPublicProfilesOptions) {
  const profiles = []
  for (const id of ids) {
      try {
          const user = await req.payload.findByID({
              req,
              id,
              collection: UsersSlug,
              depth: 0,
          })
          if (user) {
              profiles.push({
                  id: user.id,
                  name: `${user.firstName} ${user.lastName}`,
              })
          }
      } catch (e) {
          // ignore
      }
  }
  return profiles
}
