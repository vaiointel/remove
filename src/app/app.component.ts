import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import MagicWand from './libs/magic-wand-js';
export interface DOWNPOINT {
  x: number;
  y: number;
}
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit {
  @ViewChild('borderMaskSelectCanvas', { static: true }) borderMaskSelectCanvas: ElementRef;
  @ViewChild('canvas_maskEditContainer', { static: true }) canvasMaskEditContainer: ElementRef;
  @ViewChild('fillcanvas', { static: true }) fillcanvasObject: ElementRef;
  @ViewChild('imagePixelsCanvas', { static: true }) imagePixelsCanvasObject: ElementRef;
  title = 'bgremove';
  public imagePath;
  public imgURL: string;
  public message: string;
  public downPoint: DOWNPOINT;
  public isMsgActive: boolean;
  public selectedImage = new Image();
  public selectedImageHeight = 0;
  public selectedImageWidth = 0;
  public hatchOffset = 0;
  public blurRadius = 5;
  public simplifyTolerant = 0;
  public simplifyCount = 30;
  public hatchLength = 4;
  public imageInfo = null;
  public cacheInd = null;
  public mask = null;
  public allowDraw = false;
  public fillcanvas: any;
  public imagePixelsCanvas: any;
  public imgCurrentHeight: number;
  public imgCurrentWidth: number;
  public maskCanvas = {
    width: 500,
    height: 500
  };
  public widthRatio: number;
  public heightRatio: number;
  public preview = files => {
    if (files.length === 0) {
      return;
    }
    const mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      this.message = 'Only images are supported.';
      return;
    }
    const reader = new FileReader();
    this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = (EVENT) => {
      this.imgURL = reader.result as string;
      this.selectedImage.onload = () => {
        console.log('Image Loaded');
        this.selectedImageWidth = this.selectedImage.width;
        this.selectedImageHeight = this.selectedImage.height;
      };
    };
  }
  ngOnInit() {
    const maxiumimageWidth = 1550;
    const borderMaskCanvas = this.borderMaskSelectCanvas.nativeElement;
    const borderMaskCanvasCtx = borderMaskCanvas.getContext('2d');
    borderMaskCanvasCtx.clearRect(0, 0, borderMaskCanvas.width, borderMaskCanvas.height);
    borderMaskCanvas.width = this.maskCanvas.width; // set to original or resized image width
    borderMaskCanvas.height = this.maskCanvas.height; // set to original or resized image width
    // = fillcanvas.getContext("2d");
    const orgImgAspectRatio = this.selectedImageWidth / this.selectedImageHeight;
    if (this.selectedImageWidth > maxiumimageWidth) {
      this.selectedImageWidth = maxiumimageWidth;
      this.selectedImageHeight = Math.round(maxiumimageWidth / orgImgAspectRatio);
    }
    if (this.selectedImageHeight > maxiumimageWidth) {
      this.selectedImageWidth = Math.round(maxiumimageWidth * orgImgAspectRatio);
      this.selectedImageHeight = maxiumimageWidth;
    }
    this.widthRatio = this.selectedImageWidth / this.maskCanvas.width;
    this.heightRatio = this.selectedImageHeight / this.maskCanvas.height;
    this.imgCurrentHeight = $scope.maskImg.currentHeight;
    this.imgCurrentWidth = $scope.maskImg.currentWidth;
    this.imagePixelsCanvas.width = this.fillcanvas.width = this.selectedImageWidth;
    this.imagePixelsCanvas.height = this.fillcanvas.height = this.selectedImageHeight;
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      var tempCvs = document.createElement("canvas");
      var tempCtx = tempCvs.getContext("2d");
      tempCtx.canvas.width = this.selectedImageWidth;
      tempCtx.canvas.height = this.selectedImageHeight;
      tempCtx.drawImage(newImg, 0, 0, tempCvs.width, tempCvs.height);
      //$('.xe-img-footer-wrap').html(tempCvs);
      imageInfo = {
        width: this.selectedImageWidth,
        height: this.selectedImageHeight,
        context: imagePixelsCanvas.getContext("2d")
      };
      imageInfo.data = tempCtx.getImageData(0, 0, this.selectedImageWidth, this.selectedImageHeight);
      tempCtx = tempCvs = null;
      newImg = null;
    }
    newImg.src = $scope.imagePath;
    mask = null;
  }

  public hatchTick = () => {
    this.hatchOffset = (this.hatchOffset + 1) % (this.hatchLength * 2);
    this.drawBorder(true);
  }

  public drawBorder(noBorder) {
    if (!this.mask) { return; }
    let x;
    let y;
    let i;
    let j;
    let w = this.imageInfo.width,
      h = this.imageInfo.height,
      ctx = this.imageInfo.context,
      imgData = ctx.createImageData(w, h),
      res = this.imgData.data;
    if (!noBorder) {
      this.cacheInd = MagicWand.getBorderIndices(this.mask);
    }
    ctx.clearRect(0, 0, w, h);
    const len = this.cacheInd.length;
    for (j = 0; j < len; j++) {
      i = this.cacheInd[j];
      x = i % w; // calc x by index
      y = (i - x) / w; // calc y by index
      k = (y * w + x) * 4;
      if ((x + y + this.hatchOffset) % (this.hatchLength * 2) < this.hatchLength) { // detect hatch color
        res[k + 3] = 255; // black, change only alpha
      } else {
        res[k] = 255; // white
        res[k + 1] = 255;
        res[k + 2] = 255;
        res[k + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  public onMouseDown = EVENT => {
    if (EVENT.button === 0) {
      this.allowDraw = true;
      this.downPoint = this.getMousePosition(EVENT);
      /*console.log(downPoint.x,downPoint.y);
      borderMaskCanvasCtx.font = "20px Arial";
      borderMaskCanvasCtx.fillText(downPoint.x + ","+ downPoint.y ,downPoint.x,downPoint.y);*/
      this.downPoint = this.updateDrawPoint(this.downPoint);
      drawMask(this.downPoint.x, this.downPoint.y);
      /*downPoint.x = (downPoint.x * mulWidth) || 0;
      downPoint.y = (downPoint.y * mulHeight) || 0;*/
    } else { this.allowDraw = false; }
    this.isMsgActive = false;
  }

  public getMousePosition = e => {
    const actualDownPoint = { x: 0, y: 0 } as DOWNPOINT;
    const boundingRect = this.borderMaskSelectCanvas.nativeElement.getBoundingClientRect();
    actualDownPoint.x = (e.clientX - boundingRect.left) / (boundingRect.right - boundingRect.left)
      * this.borderMaskSelectCanvas.nativeElement.width;
    actualDownPoint.y = (e.clientY - boundingRect.top) / (boundingRect.bottom - boundingRect.top)
      * this.borderMaskSelectCanvas.nativeElement.height;
    return actualDownPoint;
  }

  public updateDrawPoint = (dPoint) => {
    const mulWidth = (this.selectedImageWidth / parseInt(imgCurrentWidth));
    var mulHeight = (this.selectedImageHeight / parseInt(imgCurrentHeight));
    var aImgHt, extHtY, extWtX, discardHt = {},
      discardWt = {},
      aPointX, aPointY;
    //Calculate extra height present in canvas as compared to actual image.
    extWtX = ($scope.canWidth - imgCurrentWidth).toFixed();
    extHtY = ($scope.canHeight - imgCurrentHeight).toFixed();
    //Height pixel which should not be calculated.
    discardHt.x1 = extHtY / 2;
    discardHt.x2 = $scope.canHeight - extHtY / 2;
    //Width pixel which should not be calculated.
    discardWt.x1 = extWtX / 2;
    discardWt.x2 = $scope.canWidth - extWtX / 2;
    aPointX = dPoint.x - extWtX / 2;
    aPointY = dPoint.y - extHtY / 2;
    if ((dPoint.x > discardWt.x1 && dPoint.x < discardWt.x2) && (dPoint.y > discardHt.x1 && dPoint.y < discardHt.x2)) {
      if ((this.selectedImageWidth == parseInt(imgCurrentWidth)) &&
        (this.selectedImageHeight == parseInt(imgCurrentHeight))) {
        dPoint.x = parseInt((dPoint.x * mulWidth).toFixed());
        dPoint.y = parseInt((dPoint.y * mulHeight).toFixed());
        return dPoint;
      }
      dPoint.x = parseInt((aPointX * mulWidth).toFixed());
      dPoint.y = parseInt((aPointY * mulHeight).toFixed());
    } else {
      dPoint = "";
    }

    return dPoint;
  }
}
