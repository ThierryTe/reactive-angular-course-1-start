import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { Course, sortCoursesBySeqNo } from "../model/course";
import { catchError, map, shareReplay, tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { LoadingService } from "../loading/loading.service";
import { MessagesService } from "../messages/messages.service";

@Injectable({
    providedIn: 'root'}
)
export class CoursesStore{


 private subject = new BehaviorSubject<Course[]>([]);
 courses$: Observable<Course[]> = this.subject.asObservable();


constructor(private http:HttpClient,
    private loadingService: LoadingService,
    private messages:MessagesService){
        this.loadAllCourses();
    }

 
 

private loadAllCourses(){
   const loadCourses$ = this.http.get<Course[]>('/api/courses')
       .pipe(
        map(response => response["payload"]),
        catchError(err =>{
            const message = "Echec du chargement de la page";
            this.messages.showErrors(message);
            console.log(message,err);
            return throwError(err);
        }),
        tap(courses => this.subject.next(courses))
       );
       this.loadingService.showLoader(loadCourses$).subscribe();
}


saveCourse(courseId:string,changes:Partial<Course>):Observable<any>{
    const courses = this.subject.getValue();
    const index = courses.findIndex(course =>course.id ==courseId);
    const newCourse: Course= {
        ...courses[index],
        ...changes
    };
    const newCourses:Course[] =courses.slice(0);
    newCourses[index] = newCourse;
    this.subject.next(newCourses);
    return this.http.put(`/api/courses/${courseId}`,changes)
            .pipe(
                    catchError(err =>{
                        const message = "Impossible de mettre à jour le cours";
                        console.log(message,err),
                        this.messages.showErrors(message);
                        return throwError(err);
                    } ),
                 
                shareReplay()
            );


}


 filterByCategory(category:string):Observable<Course[]>{
     return this.courses$.pipe(
        map(courses => courses.filter(course =>course.category == category)
        .sort(sortCoursesBySeqNo))
     )
 }
}