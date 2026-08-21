const pools={
  macrosnap:['#MacroTracking','#Macros','#Nutrition','#FitnessNutrition','#HealthyEating','#MealTracking','#ProteinGoals','#FitnessGoals','#HealthyLifestyle','#NutritionApp','#FitnessApp','#MealPrep'],
  posterfit:['#WorkoutPlan','#FitnessPlan','#FitnessGoals','#GymMotivation','#WorkoutMotivation','#StrengthTraining','#FitnessJourney','#TrainingPlan','#HealthyLifestyle','#FitnessApp','#GymLife','#Workout'],
  both:['#Fitness','#HealthAndFitness','#FitnessGoals','#HealthyLifestyle','#FitnessJourney','#Nutrition','#Workout','#GymMotivation','#FitnessApp','#Wellness','#Consistency','#HealthyHabits']
};
const hooks={
  macrosnap:['Take the guesswork out of tracking your meals.','A photo can make macro tracking a whole lot simpler.','Track meals. See your macros. Stay consistent.'],
  posterfit:['Your training plan should fit your goals—not the other way around.','Turn your fitness goals into a plan you can actually follow.','Plan the work. Track the progress. Keep moving forward.'],
  both:['Plan your training and keep your nutrition on track in one simple routine.','Better consistency starts with a plan you can actually use.','Training and nutrition work better when they work together.']
};
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
export async function POST(req){
  try{
    const body=await req.json();
    const app=body.app||'both';
    const urls=body.urls||{};
    const url=app==='macrosnap'?urls.macrosnap:app==='posterfit'?urls.posterfit:[urls.macrosnap,urls.posterfit].filter(Boolean).join('\n');
    const tags=shuffle(pools[app]||pools.both).slice(0,10).join(' ');
    const cta=app==='macrosnap'?'Try MacroSnap today.':app==='posterfit'?'Build your PosterFit plan today.':'Check out MacroSnap + PosterFit.';
    const caption=`${pick(hooks[app]||hooks.both)}\n\n${cta}${url?`\n${url}`:''}\n\n${tags}`;
    return Response.json({caption});
  }catch(error){return Response.json({error:error.message||'Caption generation failed'},{status:500});}
}
