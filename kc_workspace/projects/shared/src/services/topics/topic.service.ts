import {Injectable} from '@angular/core';
import {TopicModel} from '../../models/topic.model';
import {UuidService} from '../uuid/uuid.service';
import {BehaviorSubject} from "rxjs";

let tempTopicSource: TopicModel[] = [
  {
    id: {value: '697b08fe-df4d-4bbc-9518-d421d0258148'},
    name: 'Computer Science',
    description: 'The study of the hardware and software components of computers.',
    dateCreated: Date(),
    dateUpdated: Date()
  },
  {
    id: {value: 'd009de90-962d-4cf9-9f7d-3e892d64d517'},
    name: 'AI/ML',
    description: 'The study of artificial intelligence and machine learning.',
    dateCreated: Date(),
    dateUpdated: Date()
  },
  {
    id: {value: "f91b448f-77d4-40c0-aae9-b68232fa48dd"},
    name: "Homework",
    description: "Homework and other school related stuff.",
    dateCreated: Date(),
    dateUpdated: Date()
  }
]

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private topicSource = new BehaviorSubject<TopicModel[]>([]);
  public topics = this.topicSource.asObservable();

  constructor(private uuidService: UuidService) {
    this.topicSource.next(tempTopicSource);
  }

  create(topicStr: string): TopicModel {
    let uuid = this.uuidService.generate(1)[0];
    let topic = new TopicModel(uuid, topicStr);
    let topicSource = [...this.topicSource.value, topic];
    this.topicSource.next(topicSource);
    return topic;
  }

  exists(id: string): boolean {
    return this.topicSource.value.find(topic => topic.id.value === id) !== undefined;
  }

  find(topicStr: string): TopicModel | undefined {
    return this.topicSource.value.find(topic => topic.name === topicStr);
  }
}
