export class Moment {
  clockwiseMoment(force: number, distance: number) {
    return force * distance;
  }

  antiClockwiseMoment(force: number, distance: number) {
    return force * distance * -1;
  }
}
