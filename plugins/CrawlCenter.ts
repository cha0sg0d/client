import { LocatablePlanet, Planet, PlanetType, SpaceType } from "@darkforest_eth/types";

console.log(df, ui);

const maxLevel = 5
const maxDistributeEnergyPercent = 75;




const planetCanUpgrade = (planet:LocatablePlanet) => {
    const totalRank = planet.upgradeState.reduce((a, b) => a + b);
    if (planet.spaceType === SpaceType.NEBULA && totalRank >= 3) return false;
    if (planet.spaceType === SpaceType.SPACE && totalRank >= 4) return false;
    if (planet.spaceType === SpaceType.DEEP_SPACE && totalRank >= 5) return false;
    if (planet.spaceType === SpaceType.DEAD_SPACE && totalRank >= 5) return false;
    return (
      planet.planetLevel !== 0 &&
      planet.planetType === PlanetType.PLANET &&
      planet.silver >= silverNeededForUpgrade(planet)
    );
  };
  
  const silverNeededForUpgrade = (planet: LocatablePlanet) => {
    const totalLevel = planet.upgradeState.reduce((a, b) => a + b);
    return (totalLevel + 1) * 0.2 * planet.silverCap;
  };
  
  const upgradablePlanets = () => {
    return df.getMyPlanets().filter(planetCanUpgrade);
  };



const procgenUtils = df.getProcgenUtils();

const distanceToCenter = (planet: LocatablePlanet) => {
    return Math.floor(Math.sqrt(Math.pow(planet.location.coords.x,2) + Math.pow(planet.location.coords.y,2)));
}

function distance(from: LocatablePlanet, to: LocatablePlanet) {
    let fromloc = from.location;
    let toloc = to.location;
    return Math.sqrt((fromloc.coords.x - toloc.coords.x) ** 2 + (fromloc.coords.y - toloc.coords.y) ** 2);
}

const choosePlanet = (a: { to: LocatablePlanet; radius: number; distance: number; }, b: { to: LocatablePlanet; radius: number; distance: number; }) => {
    // if (b.to.planetLevel != a.to.planetLevel) {
    //     b.to.planetLevel - a.to.planetLevel
    // }
    return a.distance - b.distance;
}

// For each planet, crawl to planet that is closest to center.
function crawlPlanets () {
    var planetList = df.getMyPlanets() as LocatablePlanet[];
    planetList = planetList
    .filter(
        p => (
            p.planetLevel < maxLevel &&
            p.energy >= p.energyCap * maxDistributeEnergyPercent / 100 &&
            p.planetLevel > 1    
        )
    )
    .sort((a,b) => b.planetLevel - a.planetLevel);
    
    planetList.forEach(myPlanet => {
        if(myPlanet.planetType == PlanetType.TRADING_POST) {
            const silver = Math.ceil(myPlanet.silver * maxDistributeEnergyPercent / 100);
            df.withdrawSilver(myPlanet.locationId, silver);
            
        }

        if(planetCanUpgrade(myPlanet) && myPlanet.silver >= silverNeededForUpgrade(myPlanet)) {
            df.upgrade(myPlanet.locationId, 1);
            console.log(`Upgrading ${procgenUtils.getPlanetName(myPlanet)}`);
        }

        const myDistance = distanceToCenter(myPlanet);
        // Find planet closest to center same level or 1 above and send 75% of energy.
        var candidates = df.getPlanetsInRange(myPlanet.locationId, maxDistributeEnergyPercent) as LocatablePlanet[];
        const bestCandidates = candidates
        .filter(p => (
            p.locationId !== myPlanet.locationId &&
            p.planetLevel >= myPlanet.planetLevel &&
            myDistance > distanceToCenter(p) // only want planets that are closer to center
            // p.planetType === planetType
        ))
        .map(to => {
            return {to, radius: distanceToCenter(to), distance: distance(myPlanet,to)}
        })
        .sort(choosePlanet)
        // after getting planets closest to center, then sort by closest to planet.
        .slice(0,1);

        const candidate = bestCandidates[0].to;

        const silver = Math.ceil(myPlanet.silver * maxDistributeEnergyPercent / 100);
        const energy = Math.max(Math.ceil(myPlanet.energy - myPlanet.energyCap *.25), Math.ceil(myPlanet.energy * maxDistributeEnergyPercent / 100));

        df.move(myPlanet.locationId, candidate.locationId, energy, silver);
        console.log(`Moving from ${procgenUtils.getPlanetName(myPlanet)} to ${procgenUtils.getPlanetName(candidate)}`);
        // console.log("myPlanet", myPlanet.locationId)        
        //console.log(`myPlanet radius ${distanceToCenter(myPlanet)} candidate radius ${distanceToCenter(bestCandidates[0][0])}`)
        //console.log("candidates", bestCandidates[0][0].locationId);

    });




}

 class PluginTemplate implements DFPlugin {
   constructor() {}
 
   /**
    * Called when plugin is launched with the "run" button.
    */
   async render(container: HTMLDivElement) {
    let button = document.createElement('button');
    button.style.width = '100%';
    button.style.marginBottom = '10px';
    button.innerHTML = 'Crawl towards center'
    button.onclick = () => {
       crawlPlanets();
    }
    container.append(button);
   }
 
   /**
    * Called when plugin modal is closed.
    */
   destroy() {}
 }
 
 /**
  * And don't forget to export it!
  */
 export default PluginTemplate;
 



 