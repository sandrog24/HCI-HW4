import uvicorn
 
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

app = FastAPI(title="HCI Mini Review App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

questions = [{
                "id": 0,
                "q": "Is Fitts' Law an example of a predictive model or a descriptive model?",
                "a": "Predictive model"
                },
             {
                "id": 1,
                "q": "Does this course focus more on genius design, systems design, or user-centered design?",
                "a": "User-centered design"
                },
             {
                "id": 2,
                "q": "What is the main goal of the ideation phase of iterative design?",
                "a": "Generating as many possible design solutions as possible"
                },
             {
                "id": 3,
                "q": "How does the Gestalt principle of proximity help organize an interface?",
                "a": "Elements placed close together are perceived as a group, so related controls and content should be near each other."
                },
             {
                "id": 4,
                "q": "What is a signifier in interface design?",
                "a": "A perceivable cue that communicates where or how an interaction can happen, such as a labeled button or a hover state."
                }
            ]

class QuestionRequest(BaseModel):
    question: str
    answer: str

    @field_validator("question", "answer")
    @classmethod
    def require_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Questions and answers must contain text.")
        return value

@app.get("/questions")
def get_questions():
    return questions

@app.post("/add")
def add_question(req: QuestionRequest):
    questions.append({
        "id": max((question["id"] for question in questions), default=-1) + 1,
        "q": req.question,
        "a": req.answer
    })

# TODO: Add a new route that can be used to a delete a question/answer from the dataset.
@app.delete("/delete/{id}")
def delete_question(id: int):
    for question in questions:
        if question["id"] == id:
            questions.remove(question)
            print("Removing question...")
            return
    # If id was not found, raise exception
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Question with ID {id} not found")

@app.put("/update/{id}")
def update_question(id: int, req: QuestionRequest):
    for question in questions:
        if question["id"] == id:
            question["q"] = req.question
            question["a"] = req.answer
            return
    # If id was not found, raise exception
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Question with ID {id} not found")

if __name__=="__main__":
    uvicorn.run(app, port=8005)
