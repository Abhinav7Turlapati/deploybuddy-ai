import { JargonTerm } from '../types/diagnosis';

export const COMMON_JARGON: Record<string, JargonTerm> = {
  daemon: {
    term: 'Daemon',
    definition: 'A background program that runs continuously without requiring direct user interaction.',
    analogy: 'Like the building maintenance crew working in the utility room while you sit in your apartment.'
  },
  oomkilled: {
    term: 'OOMKilled (Exit Code 137)',
    definition: 'Out-Of-Memory Killer is an OS safety mechanism that forcibly terminates processes consuming more RAM than permitted.',
    analogy: 'Like a restaurant bouncer politely escorting someone out when the room exceeds maximum legal fire capacity.'
  },
  crashloopbackoff: {
    term: 'CrashLoopBackOff',
    definition: 'A Kubernetes state where a container crashes immediately upon startup, and Kubernetes waits longer between each restart attempt to avoid melting the server.',
    analogy: 'Like trying to start a stalled car, waiting 10 seconds before turning the key again so you don’t drain the battery.'
  },
  lockfile: {
    term: 'Lockfile (package-lock.json)',
    definition: 'A blueprint recording the exact byte-for-byte version of every single sub-dependency installed, ensuring everyone gets the exact same code.',
    analogy: 'A grocery shopping list that specifies not just "apples", but "Honeycrisp apples from Orchard 4 picked on Tuesday".'
  },
  socket: {
    term: 'Unix Socket (docker.sock)',
    definition: 'A high-speed communication pipe on your machine that lets the Docker CLI tell the background Docker engine what to do.',
    analogy: 'An internal intercom phone between the front reception desk and the warehouse.'
  },
  port: {
    term: 'Network Port',
    definition: 'A virtual channel number (like 8080 or 3000) that directs network traffic to a specific software application.',
    analogy: 'Like apartment numbers inside a single large apartment building with one main street address.'
  },
  bean: {
    term: 'Spring Bean',
    definition: 'An object instantiated, assembled, and managed by the Spring IoC (Inversion of Control) container.',
    analogy: 'A tool kept in a communal workshop rack that any craftsman can grab without having to build the tool themselves.'
  },
  github_token: {
    term: 'GITHUB_TOKEN',
    definition: 'An automatic temporary security key provided to each workflow job to interact with the repository API.',
    analogy: 'A guest hotel keycard that only opens your bedroom door and expires at 11 AM.'
  }
};
